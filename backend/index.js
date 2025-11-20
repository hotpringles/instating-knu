const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
require("dotenv").config();

const { auth, adminAuth } = require("./auth");

const app = express();
const prisma = new PrismaClient();

// Determine upload directory based on environment
// Vercel file system is read-only except for /tmp
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: ["https://instating-knu-app.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use("/uploads", express.static(uploadDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Utility function
const getOneWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
};

// --- API Routes ---

app.get("/", (req, res) => {
  res.send("InstaTing Backend is running!");
});

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
    interests,
  } = req.body;

  if (!studentId || !password || !name) {
    return res
      .status(400)
      .json({ message: "학번, 비밀번호, 이름은 필수 항목입니다." });
  }
  if (!studentId.startsWith("202")) {
    if (req.file) {
      const filePath = path.join(
        uploadDir,
        req.file.filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return res
      .status(400)
      .json({
        message: "경북대학교 학생이 맞으신가요? 학번은 202로 시작해야 합니다.",
      });
  }
  if (!req.file) {
    return res.status(400).json({ message: "프로필 사진은 필수입니다." });
  }
  const photoUrl = `/uploads/${req.file.filename}`;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { studentId },
    });
    if (existingUser) {
      return res.status(409).json({ message: "이미 가입된 학번입니다." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({
      data: {
        studentId,
        password: hashedPassword,
        name,
        department,
        gender,
        instagramId,
        coins: 2,
        photo: photoUrl,
        interests: interests ? JSON.parse(interests) : [],
      },
    });
    res.status(201).json({ message: "회원가입 성공!", user: newUser });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
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
  const { studentId, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { studentId: String(studentId) },
      include: {
        revealedProfiles: { select: { userId: true, cardId: true } },
      },
    });
    if (!user) {
      return res
        .status(401)
        .json({ message: "학번 또는 비밀번호가 일치하지 않습니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "학번 또는 비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: userPassword, ...userWithoutPassword } = user;
    res.status(200).json({
      message: "로그인 성공!",
      user: userWithoutPassword,
      token,
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
        studentId: String(studentId),
        department,
        instagramId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "일치하는 사용자 정보가 없습니다." });
    }

    const tempPassword = "temp" + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

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
        revealedProfiles: { select: { userId: true, cardId: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const now = new Date();
    const lastUpdate = new Date(user.lastCoinUpdate);

    if (
      lastUpdate.getFullYear() < now.getFullYear() ||
      lastUpdate.getMonth() < now.getMonth() ||
      lastUpdate.getDate() < now.getDate() ||
      lastUpdate.getHours() < now.getHours()
    ) {
      user = await prisma.user.update({
        where: { id: req.user.id },
        data: { coins: 2, lastCoinUpdate: now },
        include: {
          revealedProfiles: { select: { userId: true, cardId: true } },
        },
      });
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
      where: { createdAt: { gte: oneWeekAgo } },
      orderBy: { createdAt: "desc" },
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
          select: { revealedBy: true },
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
 * @access  Private
 */
app.post("/api/matching-cards", auth, async (req, res) => {
  const { description, matchType } = req.body;
  const authorId = req.user.id;

  if (!description || !matchType) {
    return res
      .status(400)
      .json({ message: "소개와 매칭 타입은 필수입니다." });
  }

  try {
    const existingCard = await prisma.matchingCard.findFirst({
      where: { authorId },
    });

    if (existingCard) {
      return res.status(409).json({
        message: "이미 등록한 매칭 카드가 있습니다. 하나만 등록할 수 있습니다.",
      });
    }

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
    const [card, user] = await prisma.$transaction([
      prisma.matchingCard.findUnique({ where: { id: cardId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

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

    const existingReveal = await prisma.revealedProfile.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    if (existingReveal) {
      return res.status(409).json({ message: "이미 열어본 카드입니다." });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: 1 } },
      });
      await tx.notification.create({
        data: {
          userId: card.authorId,
          message: "누군가 당신의 매칭 카드를 살펴봤어요.",
        },
      });
      await tx.revealedProfile.create({
        data: { userId, cardId },
      });
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

  if (interests) {
    try {
      dataToUpdate.interests = JSON.parse(interests);
    } catch (e) {
      return res
        .status(400)
        .json({ message: "잘못된 형식의 관심사 데이터입니다." });
    }
  }

  if (req.file) {
    dataToUpdate.photo = `/uploads/${req.file.filename}`;
  }

  try {
    // Vercel environment check or cleanup logic if needed
    // ...

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: {
        revealedProfiles: { select: { userId: true, cardId: true } },
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
      where: { id: notificationId, userId: req.user.id },
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

// --- 관리자 API ---

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
    await prisma.$transaction(async (tx) => {
      await tx.revealedProfile.deleteMany({ where: { cardId: cardId } });
      await tx.matchingCard.delete({ where: { id: cardId } });
    });
    res.status(200).json({ message: "카드가 성공적으로 삭제되었습니다." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ message: "삭제할 카드를 찾을 수 없습니다." });
    }
    console.error("관리자: 카드 삭제 중 오류:", error);
    res
      .status(500)
      .json({ message: "카드 삭제 중 서버 오류가 발생했습니다." });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    특정 사용자 강제 삭제
 * @access  Admin
 */
app.delete("/api/admin/users/:userId", auth, adminAuth, async (req, res) => {
  const { userId } = req.params;

  if (req.user.id === userId) {
    return res
      .status(400)
      .json({ message: "자기 자신을 삭제할 수 없습니다." });
  }

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return res
        .status(404)
        .json({ message: "삭제할 사용자를 찾을 수 없습니다." });
    }
    await prisma.$transaction(async (tx) => {
      const userCards = await tx.matchingCard.findMany({
        where: { authorId: userId },
      });
      const cardIds = userCards.map((card) => card.id);
      if (cardIds.length > 0) {
        await tx.revealedProfile.deleteMany({
          where: { cardId: { in: cardIds } },
        });
      }

      await tx.notification.deleteMany({ where: { userId } });
      await tx.revealedProfile.deleteMany({ where: { userId } });
      await tx.matchingCard.deleteMany({ where: { authorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    // File deletion logic omitted for Vercel/production safety or needs S3
    res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "사용자 삭제 중 오류가 발생했습니다." });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;