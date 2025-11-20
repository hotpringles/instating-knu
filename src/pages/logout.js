import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // 'accessToken' 쿠키를 만료시켜 로그아웃을 처리합니다.
  const cookie = serialize("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: -1, // 쿠키를 즉시 만료시킵니다.
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ message: "로그아웃 성공" });
}
