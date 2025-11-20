import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { useRouter } from "next/navigation";

const prisma = new PrismaClient();

// 이 페이지는 로그인한 사용자만 볼 수 있는 메인 페이지입니다.
export default function MainPage({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
      router.push("/LoginPage");
    } catch (error) {
      console.error("Logout error:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background-light text-text-light shadow-lg dark:bg-background-dark dark:text-text-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <h1 className="text-xl font-bold tracking-tight">인팅눈팅</h1>
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          로그아웃
        </button>
      </header>
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-bold">환영합니다, {user.name}님!</h2>
        <p className="mt-2 text-text-light/70 dark:text-text-dark/70">
          로그인에 성공하셨습니다.
        </p>
        <div className="mt-6 space-y-2 rounded-lg bg-subtle-light p-4 dark:bg-subtle-dark">
          <p>
            <strong>학번:</strong> {user.studentId}
          </p>
          <p>
            <strong>학과:</strong> {user.department}
          </p>
          <p>
            <strong>인스타 ID:</strong> {user.instagramId}
          </p>
          <div className="pt-4">
            <Link
              href="/profile/edit"
              className="font-medium text-primary hover:underline"
            >
              프로필 수정하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// 페이지가 렌더링되기 전에 서버에서 실행되는 함수
export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.cookies.accessToken;

  // 1. 쿠키에 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    return {
      redirect: {
        destination: "/LoginPage",
        permanent: false,
      },
    };
  }

  try {
    // 2. 토큰을 확인(verify)하고, 유효하면 payload(userId)를 가져옴
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    // 3. payload의 userId로 DB에서 사용자 정보를 조회
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 사용자가 없거나 비밀번호 필드가 있는 경우를 처리
    if (!user) throw new Error("User not found");
    const { password, ...userWithoutPassword } = user;

    // 4. 사용자 정보를 props로 페이지에 전달
    return { props: { user: userWithoutPassword } };
  } catch (error) {
    // 5. 토큰이 유효하지 않으면 쿠키를 삭제하고 로그인 페이지로 리다이렉트
    console.error("Token verification failed:", error);
    // 참고: 쿠키 삭제 로직을 추가할 수도 있습니다.
    return {
      redirect: {
        destination: "/LoginPage",
        permanent: false,
      },
    };
  }
}
