import { useState, useEffect } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";

export default function MatchingPage() {
  const {
    userProfile,
    matchingGroupCards,
    fetchMatchingCards,
    addMatchingCard,
    revealCardProfile,
    notifications,
    deleteMatchingCard,
    markAsRead,
    fetchNotifications,
  } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState(
    location.state?.defaultTab || "explore"
  ); // explore, notifications, profile
  const [activeSubTab, setActiveSubTab] = useState("2v2"); // 2v2, 3v3, request

  // 매칭 신청 폼 상태
  const [requestIntro, setRequestIntro] = useState("");
  const [requestType, setRequestType] = useState("2v2");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 컴포넌트가 처음 마운트될 때 매칭 카드 목록을 불러옵니다.
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchMatchingCards();
      } catch (err) {
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchMatchingCards]); // fetchMatchingCards는 useCallback으로 메모이제이션 되어있음

  // 알림 탭이 활성화될 때마다 알림 목록을 새로고침합니다.
  useEffect(() => {
    if (activeMainTab === "notifications") {
      fetchNotifications();
    }
  }, [activeMainTab, fetchNotifications]);

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-md flex-col bg-background-light shadow-lg dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="flex w-12 items-center justify-start">
          {/* Placeholder for centering title */}
        </div>
        <h2 className="flex-1 text-center text-xl font-bold leading-tight tracking-[-0.015em] text-text-primary-light dark:text-text-primary-dark">
          매칭
        </h2>
        <div className="flex w-12 items-center justify-end">
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <span className="material-symbols-outlined !text-base">
              monetization_on
            </span>
            <span className="text-sm font-bold">{userProfile.coins || 0}</span>
          </div>
          {/* <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary-light transition hover:bg-black/5 dark:text-text-primary-dark dark:hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-3xl">search</span>
          </button> */}
        </div>
      </header>

      {activeMainTab === "explore" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-4">
            <div className="flex justify-center border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveSubTab("2v2")}
                className={`px-6 py-3 text-base font-bold ${
                  activeSubTab === "2v2"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 dark:text-gray-400"
                }`}
              >
                2:2 매칭
              </button>
              <button
                onClick={() => setActiveSubTab("3v3")}
                className={`px-6 py-3 text-base font-bold ${
                  activeSubTab === "3v3"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 dark:text-gray-400"
                }`}
              >
                3:3 매칭
              </button>
              <button
                onClick={() => setActiveSubTab("request")}
                className={`px-6 py-3 text-base font-bold ${
                  activeSubTab === "request"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 dark:text-gray-400"
                }`}
              >
                매칭 신청
              </button>
            </div>
          </div>
          {activeSubTab === "request" ? (
            <div className="flex-grow p-4">
              <h3 className="text-lg font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                매칭 정보 입력
              </h3>
              <p className="mt-1 mb-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                자신을 어필할 수 있는 소개와 원하는 매칭 타입을 선택해주세요.
              </p>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium text-text-light/70 dark:text-text-dark/70">
                      학과
                    </p>
                    <div className="relative flex w-full items-center">
                      <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                        school
                      </span>
                      <input
                        type="text"
                        value={userProfile.department || ""}
                        disabled
                        className="form-input h-14 w-full rounded-lg border-none bg-subtle-light/70 pl-12 pr-4 text-base text-text-light/70 dark:bg-subtle-dark/70 dark:text-text-dark/70"
                      />
                    </div>
                  </label>
                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium text-text-light/70 dark:text-text-dark/70">
                      인스타 아이디
                    </p>
                    <div className="relative flex w-full items-center">
                      <div className="absolute left-4 text-text-light/50 dark:text-text-dark/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="20"
                            height="20"
                            rx="5"
                            ry="5"
                          ></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={userProfile.instagramId || ""}
                        disabled
                        className="form-input h-14 w-full rounded-lg border-none bg-subtle-light/70 pl-12 pr-4 text-base text-text-light/70 dark:bg-subtle-dark/70 dark:text-text-dark/70"
                      />
                    </div>
                    <p className="mt-1 pl-1 text-xs text-slate-500 dark:text-gray-500">
                      인스타 아이디 수정은 프로필 페이지에서 해주세요
                    </p>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                </div>
                <label className="flex w-full flex-col">
                  <p className="pb-2 text-sm font-medium text-text-light/70 dark:text-text-dark/70">
                    자기소개
                  </p>
                  <textarea
                    className="w-full rounded-xl border-none bg-subtle-light p-4 text-base text-text-light focus:ring-2 focus:ring-primary dark:bg-subtle-dark dark:text-text-dark"
                    placeholder="간단한 자기소개를 입력하세요."
                    rows={4}
                    value={requestIntro}
                    onChange={(e) => setRequestIntro(e.target.value)}
                  />
                </label>
                <div>
                  <p className="pb-2 text-sm font-medium text-text-light/70 dark:text-text-dark/70">
                    매칭 타입
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRequestType("2v2")}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        requestType === "2v2"
                          ? "border border-transparent bg-primary text-white"
                          : "border border-subtle-light bg-transparent text-text-secondary-light dark:border-subtle-dark dark:text-text-secondary-dark"
                      }`}
                    >
                      #2:2 매칭
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType("3v3")}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        requestType === "3v3"
                          ? "border border-transparent bg-primary text-white"
                          : "border border-subtle-light bg-transparent text-text-secondary-light dark:border-subtle-dark dark:text-text-secondary-dark"
                      }`}
                    >
                      #3:3 매칭
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const cardData = {
                      description: requestIntro,
                      matchType: requestType,
                    };
                    const result = await addMatchingCard(cardData);
                    if (result.success) {
                      await fetchMatchingCards(); // 카드 목록을 먼저 새로고침
                      alert("매칭 신청이 완료되었습니다!"); // 그 다음 알림 표시
                      // 폼 초기화
                      setRequestIntro("");
                      setActiveSubTab(requestType);
                    } else {
                      // 실패 시 서버에서 받은 에러 메시지 표시
                      alert(result.message);
                    }
                  }}
                  className="h-14 w-full rounded-full bg-primary text-lg font-bold text-white shadow-lg shadow-primary/30 transition-transform active:scale-95 disabled:opacity-50"
                >
                  매칭 신청하기
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto p-4">
              {loading && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-slate-500">카드를 불러오는 중...</p>
                </div>
              )}
              {error && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-red-500">{error}</p>
                </div>
              )}
              {!loading && !error && (
                <div className="space-y-4">
                  {matchingGroupCards
                    .filter((card) => card.matchType === activeSubTab)
                    .map((user) => {
                      const isRevealed = userProfile.revealedProfiles?.some(
                        (p) => p.cardId === user.id
                      );
                      // 내가 만든 카드인지 확인 (studentId가 내 프로필과 같은지 비교)
                      const isMyCard = user.authorId === userProfile.id;

                      const handleExploreClick = async (cardId) => {
                        if (isRevealed) {
                          navigate(`/user/${cardId}`);
                          return;
                        }
                        if (userProfile.coins < 1) {
                          alert("코인이 부족합니다.");
                          return;
                        }
                        const confirmReveal = window.confirm(
                          "프로필을 보려면 코인 1개가 소모됩니다. 계속하시겠습니까?"
                        );

                        if (confirmReveal) {
                          const result = await revealCardProfile(cardId);
                          if (result.success) {
                            // 성공 시 즉시 프로필 페이지로 이동
                            navigate(`/user/${cardId}`);
                          }
                        }
                      };
                      return (
                        <article
                          key={user.id}
                          className="flex flex-col overflow-hidden rounded-xl bg-surface-light shadow-md dark:bg-surface-dark"
                        >
                          <div className="h-40 overflow-hidden">
                            {user.author.photo ? (
                              <div
                                className={`h-full w-full bg-cover bg-center transition-all duration-300 ${
                                  isRevealed || isMyCard
                                    ? ""
                                    : "blur-md scale-110"
                                }`}
                                style={{
                                  backgroundImage: `url('http://localhost:4000${user.author.photo}')`,
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-subtle-light text-text-light/50 dark:bg-subtle-dark dark:text-text-dark/50">
                                <span className="material-symbols-outlined text-5xl">
                                  person_off
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-4 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                                    {user.author.department}
                                  </h3>
                                  {user._count.revealedBy >= 5 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/50 dark:text-red-400">
                                      인기
                                    </span>
                                  )}
                                  {user.author.gender === "male" && (
                                    <span className="material-symbols-outlined text-blue-500">
                                      male
                                    </span>
                                  )}
                                  {user.author.gender === "female" && (
                                    <span className="material-symbols-outlined text-pink-500">
                                      female
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark">
                                  <a
                                    href={`https://www.instagram.com/${user.author.instagramId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 text-base text-slate-500 dark:text-neutral-400 transition-all duration-300 ${
                                      isRevealed || isMyCard
                                        ? "hover:text-primary dark:hover:text-primary cursor-pointer"
                                        : "pointer-events-none"
                                    }`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect
                                        x="2"
                                        y="2"
                                        width="20"
                                        height="20"
                                        rx="5"
                                        ry="5"
                                      ></rect>
                                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                      <line
                                        x1="17.5"
                                        y1="6.5"
                                        x2="17.51"
                                        y2="6.5"
                                      ></line>
                                    </svg>
                                    <p
                                      className={`transition-all duration-300 ${
                                        isRevealed || isMyCard
                                          ? ""
                                          : "blur-sm select-none"
                                      }`}
                                    >
                                      {user.author.instagramId}
                                    </p>
                                  </a>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-text-primary-light dark:text-text-primary-dark">
                              {user.description}
                            </p>
                            <div className="flex w-full">
                              {isMyCard ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "등록한 카드를 삭제하시겠습니까?"
                                      )
                                    ) {
                                      deleteMatchingCard();
                                    }
                                  }}
                                  className="flex-1 h-12 rounded-lg bg-red-500 font-bold text-white transition hover:bg-red-600"
                                >
                                  삭제하기
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleExploreClick(user.id)}
                                  className="flex-1 h-12 rounded-lg bg-primary font-bold text-white transition hover:bg-primary/90"
                                >
                                  {isRevealed ? "프로필 보기" : "살펴보기"}
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeMainTab === "notifications" && (
        <div className="flex-grow overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400">
              <p>새로운 알림이 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                  <div className={`flex-1 ${n.read ? "pl-6" : ""}`}>
                    <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {n.message}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {new Date(n.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sticky bottom-0 w-full border-t border-gray-200 bg-background-light dark:border-gray-700 dark:bg-background-dark">
        <div className="flex h-16 items-center justify-around">
          {[
            { id: "explore", label: "탐색", icon: "explore" },
            { id: "notifications", label: "알림", icon: "notifications" },
            { id: "profile", label: "프로필", icon: "person" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                if (item.id === "profile") {
                  navigate("/profile");
                } else {
                  setActiveMainTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center text-xs font-medium ${
                activeMainTab === item.id
                  ? "text-primary"
                  : "text-text-secondary-light dark:text-text-secondary-dark"
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  fontVariationSettings:
                    activeMainTab === item.id ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
