const express = require("express");
const cors = require("cors"); // cors 라이브러리 가져오기
require("dotenv").config(); // .env 파일 로드
const multer = require("multer"); // multer 라이브러리 가져오기
const path = require("path"); // path 모듈 가져오기
const fs = require("fs"); // fs(파일 시스템) 모듈 가져오기

const app = express();

// --- uploads 폴더 확인 및 생성 ---
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log(`'uploads' 디렉토리가 생성되었습니다: ${uploadsDir}`);
}

// --- 미들웨어 설정 ---
// 1. CORS 설정: 배포 환경과 로컬 환경의 요청을 모두 허용합니다.
const whitelist = [
  "http://localhost:5173", // 로컬 프론트엔드 개발 서버
  "https://instating-frontend.vercel.app", // Vercel에 배포된 프론트엔드 주소 (실제 주소로 변경 필요)
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));
// 2. JSON 파서 설정: 요청 본문(body)에 담긴 JSON 데이터를 파싱하여 req.body 객체로 만듭니다.
app.use(express.json());
// 3. 정적 파일 제공: 'uploads' 폴더의 파일들을 '/uploads' 경로로 제공합니다.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Multer 설정 (파일 업로드) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 파일이 저장될 디렉토리
  },
  filename: function (req, file, cb) {
    // 파일 이름 중복을 피하기 위해 타임스탬프를 추가
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// --- Prisma Client 인스턴스 생성 ---
const prisma = new PrismaClient();

// --- 인증 미들웨어 ---
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // req 객체에 사용자 정보(id) 추가
    next();
  } catch (error) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

// --- 유틸리티 함수 ---
const getOneWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
};

// --- API 엔드포인트 ---

/**
 * @route   POST /api/signup
 * @desc    회원가입 처리
 * @access  Public
 */
app.post("/api/signup", upload.single("photo"), async (req, res) => {
  console.log("회원가입 요청 받음:", req.body);
  const {
    studentId,
    password,
    name,
    department,
    gender,
    instagramId,
    interests, // interests 필드 추가
  } = req.body;

  // 간단한 유효성 검사
  if (!studentId || !password || !name) {
    return res
      .status(400)
      .json({ message: "학번, 비밀번호, 이름은 필수 항목입니다." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "프로필 사진은 필수입니다." });
  }
  const photoUrl = `/uploads/${req.file.filename}`; // 클라이언트에서 접근할 파일 URL

  // 학번 중복 확인
  try {
    const existingUser = await prisma.user.findUnique({
      where: { studentId },
    });

    // 파일 삭제를 위한 헬퍼 함수
    const deleteUploadedFile = () => {
      if (req.file) {
        const filePath = path.join(__dirname, "uploads", req.file.filename);
        fs.unlinkSync(filePath);
        console.log(`가입 실패로 인한 파일 삭제: ${filePath}`);
      }
    };

    if (existingUser) {
      return res.status(409).json({ message: "이미 가입된 학번입니다." });
    }

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // 10 라운드로 솔트 생성 및 해싱

    const newUser = await prisma.user.create({
      data: {
        studentId, // 스키마에 따라 문자열로 저장
        password: hashedPassword, // 암호화된 비밀번호 저장
        name,
        department,
        gender,
        instagramId,
        coins: 2, // 회원가입 시 코인 2개 지급
        photo: photoUrl, // 파일 경로를 DB에 저장
        interests: interests ? JSON.parse(interests) : [], // JSON 문자열을 배열로 파싱하여 저장
      },
    });

    console.log("새로운 사용자 등록:", newUser);
    res.status(201).json({ message: "회원가입 성공!", user: newUser });
  } catch (error) {
    // Prisma 고유 제약 조건 위반 오류 (예: 학번 중복)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      deleteUploadedFile(); // DB 오류 시 업로드된 파일 삭제
      return res.status(409).json({ message: "이미 가입된 학번입니다." });
    }

    console.error("회원가입 처리 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   POST /api/login
 * @desc    로그인 처리
 * @access  Public
 */
app.post("/api/login", async (req, res) => {
  console.log("로그인 요청 받음:", req.body);
  const { studentId, password } = req.body;

  try {
    // 1. 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { studentId: String(studentId) },
      include: {
        revealedProfiles: { select: { userId: true, cardId: true } }, // 열어본 카드 목록 포함
      },
    });
    if (!user) {
      return res
        .status(401)
        .json({ message: "학번 또는 비밀번호가 일치하지 않습니다." });
    }

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "학번 또는 비밀번호가 일치하지 않습니다." });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d", // 토큰 유효기간 7일
      }
    );

    // 비밀번호를 제외한 사용자 정보 반환 (보안)
    const { password: userPassword, ...userWithoutPassword } = user;
    res.status(200).json({
      message: "로그인 성공!", // photo 필드가 자동으로 포함됨
      user: userWithoutPassword,
      token, // 생성된 토큰을 응답에 포함
    });
  } catch (error) {
    console.error("로그인 처리 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   POST /api/forgot-password
 * @desc    비밀번호 찾기/재설정
 * @access  Public
 */
app.post("/api/forgot-password", async (req, res) => {
  const { name, studentId, department, instagramId } = req.body;

  if (!name || !studentId || !department || !instagramId) {
    return res.status(400).json({ message: "모든 정보를 입력해주세요." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        name,
        studentId: String(studentId), // 항상 문자열로 조회
        department,
        instagramId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "일치하는 사용자 정보가 없습니다." });
    }

    // 임시 비밀번호 생성 (예: 'temp' + 6자리 숫자)
    const tempPassword = "temp" + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 실제 서비스에서는 이메일이나 SMS로 임시 비밀번호를 전송해야 합니다.
    // 여기서는 개발 편의를 위해 응답으로 임시 비밀번호를 직접 전달합니다.
    res.status(200).json({
      message:
        "임시 비밀번호가 발급되었습니다. 로그인 후 비밀번호를 꼭 변경해주세요.",
      tempPassword: tempPassword,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "비밀번호 재설정 중 오류가 발생했습니다." });
  }
});

/**
 * @route   GET /api/me
 * @desc    현재 로그인된 사용자 정보 가져오기 (코인 업데이트 로직 포함)
 * @access  Private
 */
app.get("/api/me", auth, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        revealedProfiles: { select: { userId: true, cardId: true } }, // 내가 열어본 카드 ID 목록 포함
      },
    });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const now = new Date();
    const lastUpdate = new Date(user.lastCoinUpdate);

    // 마지막 업데이트 시간(hour)이 현재 시간(hour)보다 이전일 경우 코인을 2개로 충전
    if (
      lastUpdate.getFullYear() < now.getFullYear() ||
      lastUpdate.getMonth() < now.getMonth() ||
      lastUpdate.getDate() < now.getDate() ||
      lastUpdate.getHours() < now.getHours()
    ) {
      user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          coins: 2,
          lastCoinUpdate: now,
        },
        include: {
          revealedProfiles: { select: { userId: true, cardId: true } },
        },
      });
      console.log(`코인 리셋: ${user.studentId} -> 2 coins`);
    }

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("내 정보 조회 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   GET /api/matching-cards
 * @desc    모든 매칭 카드 목록 불러오기
 * @access  Public
 */
app.get("/api/matching-cards", async (req, res) => {
  try {
    const oneWeekAgo = getOneWeekAgoDate();
    const cards = await prisma.matchingCard.findMany({
      where: {
        createdAt: {
          gte: oneWeekAgo, // 일주일 이내에 생성된 카드만 조회
        },
      },
      orderBy: {
        createdAt: "desc", // 최신순으로 정렬
      },
      // 작성자 정보도 함께 포함하여 불러오기
      include: {
        author: {
          select: {
            id: true,
            name: true,
            department: true,
            gender: true,
            instagramId: true,
            photo: true,
          },
        },
        _count: {
          select: { revealedBy: true }, // 카드를 살펴본 횟수 포함
        },
      },
    });
    res.status(200).json(cards);
  } catch (error) {
    console.error("매칭 카드 로딩 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   GET /api/cards/:cardId
 * @desc    특정 매칭 카드 정보 불러오기
 * @access  Public
 */
app.get("/api/cards/:cardId", async (req, res) => {
  const { cardId } = req.params;
  try {
    const card = await prisma.matchingCard.findUnique({
      where: { id: cardId },
      include: {
        author: {
          select: {
            name: true,
            department: true,
            gender: true,
            instagramId: true,
            photo: true,
            interests: true,
          },
        },
      },
    });
    if (!card) {
      return res.status(404).json({ message: "카드를 찾을 수 없습니다." });
    }
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   POST /api/matching-cards
 * @desc    새로운 매칭 카드 생성
 * @access  Private (인증 필요)
 */
app.post("/api/matching-cards", auth, async (req, res) => {
  const { description, matchType } = req.body;
  const authorId = req.user.id; // 인증 미들웨어에서 추가된 사용자 ID

  if (!description || !matchType) {
    return res.status(400).json({ message: "소개와 매칭 타입은 필수입니다." });
  }

  try {
    // 1. 이미 등록한 카드가 있는지 확인
    const existingCard = await prisma.matchingCard.findFirst({
      where: { authorId },
    }); // 한 사용자당 하나의 카드만 허용

    if (existingCard) {
      return res.status(409).json({
        message: "이미 등록한 매칭 카드가 있습니다. 하나만 등록할 수 있습니다.",
      });
    }

    // 2. 새로운 카드 생성
    const newCard = await prisma.matchingCard.create({
      data: { description, matchType, authorId },
    });
    res
      .status(201)
      .json({ message: "매칭 카드가 등록되었습니다.", card: newCard });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.error("매칭 카드 생성 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   POST /api/cards/:cardId/reveal
 * @desc    매칭 카드 살펴보기 (코인 차감)
 * @access  Private
 */
app.post("/api/cards/:cardId/reveal", auth, async (req, res) => {
  const { cardId } = req.params;
  const userId = req.user.id;

  try {
    // 1. 카드와 사용자 정보를 동시에 조회
    const [card, user] = await prisma.$transaction([
      prisma.matchingCard.findUnique({ where: { id: cardId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    // 2. 유효성 검사
    if (!card) {
      return res.status(404).json({ message: "카드를 찾을 수 없습니다." });
    }
    if (card.authorId === userId) {
      return res
        .status(400)
        .json({ message: "자신의 카드는 열어볼 수 없습니다." });
    }
    if (user.coins < 1) {
      return res.status(402).json({ message: "코인이 부족합니다." });
    }

    // 3. 이미 열어본 카드인지 확인
    const existingReveal = await prisma.revealedProfile.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    if (existingReveal) {
      return res.status(409).json({ message: "이미 열어본 카드입니다." });
    }

    // 4. 코인 차감 및 열람 기록 생성 (트랜잭션으로 처리)
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: 1 } },
      });
      // 카드 주인에게 알림 생성
      await tx.notification.create({
        data: {
          userId: card.authorId,
          message: "누군가 당신의 매칭 카드를 살펴봤어요.",
        },
      });
      await tx.revealedProfile.create({
        data: { userId, cardId },
      });
      // 최신 사용자 정보를 다시 조회하여 반환 (코인, 열람 기록 포함)
      return tx.user.findUnique({
        where: { id: userId },
        include: {
          revealedProfiles: { select: { userId: true, cardId: true } },
        },
      });
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res
      .status(200)
      .json({ message: "프로필을 열람했습니다.", user: userWithoutPassword });
  } catch (error) {
    console.error("카드 열람 처리 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   DELETE /api/matching-cards
 * @desc    자신의 매칭 카드 삭제
 * @access  Private
 */
app.delete("/api/matching-cards", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    // Prisma는 복합 고유 키가 있는 레코드를 삭제할 때, 해당 레코드를 먼저 찾아야 할 수 있습니다.
    // 여기서는 authorId로 카드를 찾고, 그 ID로 삭제합니다.
    const cardToDelete = await prisma.matchingCard.findFirst({
      where: { authorId: userId },
    });

    if (!cardToDelete) {
      return res.status(404).json({ message: "삭제할 카드가 없습니다." });
    }

    await prisma.matchingCard.delete({ where: { id: cardToDelete.id } });
    res.status(200).json({ message: "매칭 카드가 삭제되었습니다." });
  } catch (error) {
    console.error("카드 삭제 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   PUT /api/profile
 * @desc    사용자 프로필 수정
 * @access  Private
 */
app.put("/api/profile", auth, upload.single("photo"), async (req, res) => {
  const userId = req.user.id;
  const { instagramId, interests } = req.body;

  const dataToUpdate = {};

  if (instagramId) {
    dataToUpdate.instagramId = instagramId;
  }

  // interests가 문자열로 전송되므로 배열로 파싱
  if (interests) {
    try {
      dataToUpdate.interests = JSON.parse(interests);
    } catch (e) {
      return res
        .status(400)
        .json({ message: "잘못된 형식의 관심사 데이터입니다." });
    }
  }

  // 새로운 사진 파일이 업로드된 경우
  if (req.file) {
    dataToUpdate.photo = `/uploads/${req.file.filename}`;
  }

  try {
    // 사진이 업데이트되는 경우, 이전 사진 파일을 삭제하기 위해 현재 사용자 정보를 먼저 조회합니다.
    if (req.file) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (currentUser && currentUser.photo) {
        const oldFilename = path.basename(currentUser.photo);
        const oldFilePath = path.join(__dirname, "uploads", oldFilename);
        // 이전 파일이 존재하면 삭제
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`이전 파일 삭제 성공: ${oldFilePath}`);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: {
        revealedProfiles: { select: { userId: true, cardId: true } }, // 열어본 카드 목록 포함
      },
    });
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: "프로필이 업데이트되었습니다.",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("프로필 업데이트 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   GET /api/notifications
 * @desc    현재 로그인된 사용자의 알림 목록 가져오기
 * @access  Private
 */
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("알림 목록 조회 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    알림을 읽음 상태로 변경
 * @access  Private
 */
app.put("/api/notifications/:notificationId/read", auth, async (req, res) => {
  const { notificationId } = req.params;
  try {
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId, userId: req.user.id }, // 본인의 알림만 수정 가능
      data: { read: true },
    });
    res.status(200).json(updatedNotification);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
    }
    console.error("알림 읽음 처리 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// adminAuth 미들웨어: 관리자 권ahan 확인
const adminAuth = (req, res, next) => {
  // auth 미들웨어에서 사용자 정보를 req.user에 저장했다고 가정합니다.
  // 또한, 사용자 모델에 'role' 필드가 있고 관리자는 'ADMIN' 값을 가진다고 가정합니다.
  if (req.user && req.user.role === "ADMIN") {
    next(); // 사용자가 관리자일 경우 다음 미들웨어 또는 라우트 핸들러로 진행
  } else {
    // 관리자가 아닐 경우 403 Forbidden 오류 응답
    res
      .status(403)
      .json({ message: "접근 권한이 없습니다. 관리자만 접근 가능합니다." });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    모든 사용자 목록 조회
 * @access  Admin
 */
app.get("/api/admin/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    // 보안을 위해 비밀번호 필드 제거
    const usersWithoutPasswords = users.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("관리자: 사용자 목록 조회 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   GET /api/admin/cards
 * @desc    모든 매칭 카드 목록 조회
 * @access  Admin
 */
app.get("/api/admin/cards", auth, adminAuth, async (req, res) => {
  try {
    const cards = await prisma.matchingCard.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { name: true, studentId: true },
        },
      },
    });
    res.status(200).json(cards);
  } catch (error) {
    console.error("관리자: 카드 목록 조회 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route   DELETE /api/admin/cards/:cardId
 * @desc    특정 매칭 카드 강제 삭제
 * @access  Admin
 */
app.delete("/api/admin/cards/:cardId", auth, adminAuth, async (req, res) => {
  const { cardId } = req.params;
  try {
    // 트랜잭션을 사용하여 관련 데이터와 함께 카드를 삭제합니다.
    await prisma.$transaction(async (tx) => {
      // 1. 이 카드를 참조하는 모든 '살펴본 기록'을 먼저 삭제합니다.
      await tx.revealedProfile.deleteMany({ where: { cardId: cardId } });
      // 2. 매칭 카드를 삭제합니다.
      await tx.matchingCard.delete({ where: { id: cardId } });
    });
    res.status(200).json({ message: "카드가 성공적으로 삭제되었습니다." });
  } catch (error) {
    // Prisma에서 레코드를 찾지 못했을 때 발생하는 오류(P2025) 처리
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ message: "삭제할 카드를 찾을 수 없습니다." });
    }
    console.error("관리자: 카드 삭제 중 오류:", error);
    res.status(500).json({ message: "카드 삭제 중 서버 오류가 발생했습니다." });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    특정 사용자 강제 삭제
 * @access  Admin
 */
app.delete("/api/admin/users/:userId", auth, adminAuth, async (req, res) => {
  const { userId } = req.params;

  // 자기 자신은 삭제할 수 없음
  if (req.user.id === userId) {
    return res.status(400).json({ message: "자기 자신을 삭제할 수 없습니다." });
  }

  try {
    // 사용자와 관련된 모든 데이터를 트랜잭션으로 삭제
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return res
        .status(404)
        .json({ message: "삭제할 사용자를 찾을 수 없습니다." });
    }
    await prisma.$transaction(async (tx) => {
      // 이 사용자가 작성한 카드와 관련된 데이터 삭제
      const userCards = await tx.matchingCard.findMany({
        where: { authorId: userId },
      });
      const cardIds = userCards.map((card) => card.id);
      if (cardIds.length > 0) {
        await tx.revealedProfile.deleteMany({
          where: { cardId: { in: cardIds } },
        });
      }

      // 이 사용자와 관련된 다른 데이터 삭제
      await tx.notification.deleteMany({ where: { userId } });
      await tx.revealedProfile.deleteMany({ where: { userId } });
      await tx.matchingCard.deleteMany({ where: { authorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    // DB 삭제 성공 후, 실제 프로필 사진 파일 삭제
    if (userToDelete.photo) {
      // photo 경로 예: /uploads/photo-12345.png
      const filename = path.basename(userToDelete.photo); // 'photo-12345.png'
      const filePath = path.join(__dirname, "uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`파일 삭제 성공: ${filePath}`);
      }
    }
    res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "사용자 삭제 중 오류가 발생했습니다." });
  }
});

// 서버를 시작하고, 시작되면 콘솔에 메시지를 출력합니다.
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
