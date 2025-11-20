import { useState, useEffect, useCallback } from "react";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const { userProfile } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [modalImage, setModalImage] = useState(null); // 이미지 모달 상태
  const [cards, setCards] = useState([]);
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
  const blobBase =
    import.meta.env.VITE_BLOB_BASE_URL?.replace(/\/$/, "") || "";
  const photoUrl = (photo) => {
    if (!photo) return photo;
    if (/^https?:\/\//i.test(photo)) return photo;
    if (blobBase && photo.replace(/^\//, "").startsWith("uploads")) {
      const normalized = photo.startsWith("/") ? photo : `/${photo}`;
      return `${blobBase}${normalized}`;
    }
    if (baseUrl) {
      const normalized = photo.startsWith("/") ? photo : `/${photo}`;
      return `${baseUrl}${normalized}`;
    }
    return photo;
  };

  const fetchData = useCallback(
    async (type) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/${type}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
        const data = await response.json();
        if (type === "users") setUsers(data);
        if (type === "cards") setCards(data);
      } catch (error) {
        alert(error.message);
        navigate("/"); // 로그인 페이지로 이동
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (userProfile.role !== "ADMIN") {
      alert("접근 권한이 없습니다.");
      navigate("/"); // 로그인 페이지로 이동
      return;
    }
    fetchData(activeTab);
  }, [userProfile, navigate, activeTab, fetchData]);

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "정말로 이 사용자를 삭제하시겠습니까? 모든 관련 데이터(카드, 알림 등)가 함께 삭제됩니다."
      )
    )
      return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      alert("사용자가 삭제되었습니다.");
      fetchData("users"); // 목록 새로고침
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("정말로 이 카드를 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/cards/${cardId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      alert("카드가 삭제되었습니다.");
      fetchData("cards"); // 목록 새로고침
    } catch (error) {
      alert(error.message);
    }
  };

  if (userProfile.role !== "ADMIN") {
    return null; // 리디렉션 중 렌더링 방지
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background-light font-display shadow-lg dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <h2 className="flex-1 text-center text-xl font-bold text-slate-900 dark:text-white">
          관리자 페이지
        </h2>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-4">
          <div className="flex justify-center border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 font-bold ${
                activeTab === "users"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              사용자 관리
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-6 py-3 font-bold ${
                activeTab === "cards"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              카드 관리
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 text-text-light dark:text-text-dark">
          {/* --- 이미지 확대 모달 --- */}
          {modalImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
              onClick={() => setModalImage(null)}
            >
              <div className="relative max-h-[90vh] max-w-[90vw]">
                <img
                  src={modalImage}
                  alt="확대된 프로필 사진"
                  className="h-full w-full object-contain"
                  onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 모달 닫힘 방지
                />
                <button
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm"
                  aria-label="닫기"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
          )}
          {activeTab === "users" && (
            <div className="space-y-2">
              <h3 className="font-bold">사용자 목록 ({users.length}명)</h3>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg bg-subtle-light p-3 dark:bg-subtle-dark"
                >
                  <div className="flex items-start gap-4">
                    {user.photo && (
                      <img
                        src={photoUrl(user.photo)}
                        alt={user.name}
                        className="h-16 w-16 cursor-pointer rounded-lg object-cover transition hover:opacity-80"
                        onClick={() => setModalImage(photoUrl(user.photo))}
                      />
                    )}
                    <div className="flex-1">
                      <p>
                        <strong>이름:</strong> {user.name}
                      </p>
                      <p>
                        <strong>학번:</strong> {user.studentId}
                      </p>
                      <p>
                        <strong>역할:</strong> {user.role}
                      </p>
                      {user.instagramId && (
                        <p>
                          <strong>인스타:</strong>{" "}
                          <a
                            href={`https://instagram.com/${user.instagramId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {user.instagramId}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  {user.role !== "ADMIN" && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="mt-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "cards" && (
            <div className="space-y-2">
              <h3 className="font-bold">매칭 카드 목록 ({cards.length}개)</h3>
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-lg bg-subtle-light p-3 dark:bg-subtle-dark"
                >
                  <p>
                    작성자: {card.author.name} ({card.author.studentId})
                  </p>
                  <p>소개: {card.description}</p>
                  <p>타입: {card.matchType}</p>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="mt-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
