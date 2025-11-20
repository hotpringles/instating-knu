import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // 1. 토큰을 확인하여 사용자 ID를 가져옵니다.
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    // 2. 요청 본문에서 업데이트할 데이터를 가져옵니다.
    const { name, department, instagramId, photo, interests } = req.body;

    // 3. DB에서 해당 사용자의 정보를 업데이트합니다.
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        department,
        instagramId,
        photo,
        interests,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
