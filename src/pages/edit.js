import SignUpPage from "../SignUpPage"; // 기존 SignUpPage 컴포넌트를 가져옵니다.
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// 이 페이지는 SignUpPage를 재사용하여 프로필 수정 UI를 렌더링합니다.
export default function ProfileEditPage({ user }) {
  // isEditMode와 userProfile props를 SignUpPage로 전달합니다.
  return <SignUpPage isEditMode={true} userProfile={user} />;
}

// 페이지가 렌더링되기 전에 서버에서 사용자 정보를 가져옵니다.
export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.cookies.accessToken;

  if (!token) {
    return {
      redirect: {
        destination: "/LoginPage",
        permanent: false,
      },
    };
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new Error("User not found");

    // JSON으로 직렬화할 수 없는 Date 객체를 문자열로 변환합니다.
    const serializableUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const { password, ...userWithoutPassword } = serializableUser;

    return { props: { user: userWithoutPassword } };
  } catch (error) {
    console.error("Failed to fetch user for edit:", error);
    return { redirect: { destination: "/LoginPage", permanent: false } };
  }
}
