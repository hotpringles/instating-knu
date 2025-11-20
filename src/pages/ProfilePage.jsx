import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";

const statLabelMap = {
  "Profile Views": "살펴보기",
  Matches: "관심수",
};

export default function ProfilePage() {
  const { userProfile, profileStats, notifications, logout } = useData();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
  const blobBase =
    import.meta.env.VITE_BLOB_BASE_URL?.replace(/\/$/, "") || "";
  const photoUrl = (photo) => {
    if (!photo) return null;
    
    // Absolute URL (Vercel Blob 등) - 먼저 체크!
    if (/^https?:\/\//i.test(photo)) {
      return photo;
    }

    // Legacy: 'uploads/' 경로가 포함되어 있으면 (예전 로컬 파일), 이미지가 없다고 판단하여 null 반환
    if (photo.includes("uploads")) return null;
    
    // 그 외 상대 경로
    if (apiBase) {
      const normalized = photo.startsWith("/") ? photo : `/${photo}`;
      return `${apiBase}${normalized}`;
    }
    return photo;
  };

  const dynamicStats = profileStats.map((stat) => {
    if (stat.label === "Profile Views") {
      return { ...stat, value: userProfile.revealedProfiles?.length || 0 };
    }
    if (stat.label === "Matches")
      return { ...stat, value: notifications.length };
    return stat;
  });

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-light font-display shadow-lg dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="flex size-12 items-center justify-start">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-12 items-center justify-center rounded-full text-base font-bold text-slate-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-3xl">
              arrow_back
            </span>
          </button>
        </div>
        <h2 className="flex-1 text-center text-xl font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
          My Profile
        </h2>
        <div className="flex w-12 items-center justify-end">
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <span className="material-symbols-outlined !text-base">
              monetization_on
            </span>
            <span className="text-sm font-bold">{userProfile.coins || 0}</span>
          </div>
        </div>
      </header>

      {userProfile.photo && (
        <div className="@container px-4 pt-4">
          <div
            className="min-h-80 rounded-xl bg-cover bg-center @[480px]:rounded-xl"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url('${
                photoUrl(userProfile.photo)
              }')`,
            }}
            aria-label="사용자 프로필 사진"
          ></div>
        </div>
      )}

      <section className="flex px-4 py-4 @container">
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full flex-col gap-1">
            <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
              {userProfile.name}
            </p>
            <div className="flex items-center gap-2 text-base text-slate-500 dark:text-neutral-400">
              <span>
                {userProfile.department}
                {userProfile.studentId && ` (${userProfile.studentId})`}
              </span>
              {userProfile.gender === "male" && (
                <span className="material-symbols-outlined text-blue-500">
                  male
                </span>
              )}
              {userProfile.gender === "female" && (
                <span className="material-symbols-outlined text-pink-500">
                  female
                </span>
              )}
            </div>
            {userProfile.instagramId && (
              <div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-neutral-400">
                  <a
                    href={`https://www.instagram.com/${userProfile.instagramId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-base text-slate-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary"
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
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    <span>{userProfile.instagramId}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3 px-4 py-3">
        {dynamicStats
          .filter((stat) => stat.label !== "Likes Received")
          .map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-[111px] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                {statLabelMap[stat.label] || stat.label}
              </p>
            </div>
          ))}
      </section>

      <section className="px-4 py-4 @container">
        <div className="rounded-xl bg-white p-4 dark:bg-neutral-900">
          <p className="mb-3 text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
            관심사
          </p>
          <div className="flex flex-wrap gap-2">
            {userProfile.interests
              .filter((interest) => interest) // 빈 문자열 등 유효하지 않은 값을 필터링
              .map((interest) => (
                <div
                  key={interest}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                    {interest}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <div className="px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={() => navigate("/signup", { state: { isEditMode: true } })}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold tracking-[0.015em] text-white"
        >
          <span className="material-symbols-outlined">edit</span>
          <span className="truncate">Edit Profile</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("로그아웃 하시겠습니까?")) {
              logout();
              navigate("/");
            }
          }}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 text-sm font-bold tracking-[0.015em] text-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="truncate">Logout</span>
        </button>
      </div>

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
                if (item.id === "explore") {
                  navigate("/matching");
                } else if (item.id === "notifications") {
                  // 알림 탭을 기본으로 열도록 상태 전달
                  navigate("/matching", {
                    state: { defaultTab: "notifications" },
                  });
                }
              }}
              className={`flex flex-col items-center justify-center text-xs font-medium ${
                item.id === "profile"
                  ? "text-primary"
                  : "text-text-secondary-light dark:text-text-secondary-dark"
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  fontVariationSettings:
                    item.id === "profile" ? "'FILL' 1" : "'FILL' 0",
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
