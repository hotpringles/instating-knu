import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      studentId,
      password,
      name,
      // ... other fields from req.body
    } = req.body;

    // 필수 값 확인
    if (!studentId || !password || !name) {
      return res
        .status(400)
        .json({ message: "학번, 비밀번호, 이름은 필수입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { ...req.body, password: hashedPassword },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Signup error:", error);
    // 학번 중복과 같은 에러 처리
    if (error.code === "P2002") {
      return res.status(409).json({ message: "이미 가입된 학번입니다." });
    }
    return res.status(500).json({ message: "서버 에러가 발생했습니다." });
  }
}
