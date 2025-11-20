import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import MatchingPage from "./pages/MatchingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import UserDetailPage from "./pages/UserDetailPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import Layout from "./components/Layout.jsx";
import { DataProvider, useData } from "./context/DataContext.jsx";
import "./App.css";

const appPages = [
  { path: "/", label: "로그인", element: <LoginPage /> },
  { path: "/matching", label: "매칭", element: <MatchingPage /> },
  {
    path: "/signup",
    label: "회원가입",
    element: <SignUpPage />,
  },
  { path: "/profile", label: "프로필 보기", element: <ProfilePage /> },
  { path: "/admin", label: "관리자", element: <AdminPage /> },
  { path: "/user/:userId", label: "사용자 상세", element: <UserDetailPage /> },
];

function App() {
  // DataContext의 fetchCurrentUser 함수를 가져옵니다.
  // DataProvider 내에서 호출해야 하므로, App 컴포넌트 내에서 직접 사용하지 않고
  // Layout 컴포넌트 등 DataProvider의 자식에서 호출하는 것이 좋습니다.
  // 여기서는 간단하게 App 컴포넌트 내부에 별도의 컴포넌트를 만들어 처리합니다.
  const AuthHandler = () => {
    const { fetchCurrentUser, fetchNotifications } = useData();
    useEffect(() => {
      fetchCurrentUser();
      fetchNotifications();
    }, [fetchCurrentUser, fetchNotifications]);
    return null;
  };

  return (
    <BrowserRouter>
      <DataProvider>
        <Layout pages={appPages}>
          <Routes>
            {appPages.map((page) => (
              <Route key={page.path} path={page.path} element={page.element} />
            ))}
            <Route path="*" element={<LoginPage />} />
          </Routes>
          <AuthHandler />
        </Layout>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
