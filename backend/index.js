const express = require("express");
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { auth, adminAuth } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

module.exports = (upload) => {
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
  router.post("/signup", upload.single("photo"), async (req, res) => {
    // 기존 index.js에 있던 /api/signup 로직 전체를 여기에 붙여넣습니다.
    // ... (생략)
    // ... app.post 대신 router.post를 사용합니다.
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
        // Vercel 배포 환경에서는 파일 시스템 접근이 불가능하므로 주석 처리합니다.
        // const filePath = path.join(
        //   __dirname,
        //   "..",
        //   "uploads",
        //   req.file.filename
        // );
        // if (fs.existsSync(filePath)) {
        //   fs.unlinkSync(filePath);
        // }
      }
      return res.status(400).json({
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

  // 여기에 기존 index.js에 있던 다른 모든 API 라우트들을
  // app.get(...) -> router.get(...)
  // app.post(...) -> router.post(...)
  // 형태로 변환하여 붙여넣습니다.
  // (로그인, 내 정보, 카드 목록, 관리자 API 등등 전부)

  return router;
};
