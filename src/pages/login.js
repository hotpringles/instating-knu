import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { studentId, password } = req.body;

    // 1. DB에서 학번으로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: {
        studentId: studentId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "존재하지 않는 학번입니다." });
    }

    // 2. 입력된 비밀번호와 DB의 암호화된 비밀번호 비교
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 3. 로그인 성공 시 JWT 토큰 발급
    const token = jwt.sign(
      { userId: user.id }, // 토큰에 담을 정보 (사용자 ID)
      process.env.JWT_SECRET, // .env 파일의 시크릿 키
      { expiresIn: "1h" } // 토큰 만료 시간 (1시간)
    );

    // 4. 토큰을 HttpOnly 쿠키에 저장
    const cookie = serialize("accessToken", token, {
      httpOnly: true, // JavaScript에서 쿠키에 접근 불가
      secure: process.env.NODE_ENV !== "development", // 프로덕션 환경에서는 https에서만 쿠키 전송
      maxAge: 60 * 60, // 1시간 (초 단위)
      path: "/", // 사이트 전체에서 쿠키 사용
    });

    // 5. 응답 헤더에 쿠키 설정
    res.setHeader("Set-Cookie", cookie);

    // 비밀번호를 제외한 사용자 정보 반환
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "서버 에러가 발생했습니다." });
  }
}
