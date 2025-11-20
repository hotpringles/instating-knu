import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
  const blobBase =
    import.meta.env.VITE_BLOB_BASE_URL?.replace(/\/$/, "") || "";
  const encodePath = (path) => encodeURI(path);
  const photoUrl = (photo) => {
    if (!photo) return null;
    if (/^https?:\/\//i.test(photo)) {
      return photo;
    }
    const isUploadPath =
      photo.startsWith("/uploads") || photo.startsWith("uploads") || photo.includes("/uploads/");
    if (isUploadPath && blobBase) {
      const normalized = photo.startsWith("/") ? photo : `/${photo}`;
      return `${blobBase}${encodePath(normalized)}`;
    }
    if (apiBase) {
      const normalized = photo.startsWith("/") ? photo : `/${photo}`;
      return `${apiBase}${encodePath(normalized)}`;
    }
    return photo;
  };

  useEffect(() => {
    const fetchCardDetail = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cards/${userId}`
        );
        if (!response.ok) {
          throw new Error("사용자 정보를 불러오지 못했습니다.");
        }
        const data = await response.json();
        setCard(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCardDetail();
  }, [userId]);

  if (!card) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center bg-background-light font-display shadow-lg dark:bg-background-dark">
        <p className="text-slate-500 dark:text-slate-400">
          사용자 정보를 불러오는 중...
        </p>
      </div>
    );
  }

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
          프로필
        </h2>
        <div className="w-12" />
      </header>

      {card.author.photo && (
        <div className="@container px-4 pt-4">
          <div
            className="min-h-80 rounded-xl bg-cover bg-center @[480px]:rounded-xl"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url('${
                photoUrl(card.author.photo)
              }')`,
            }}
            aria-label="사용자 프로필 사진"
          ></div>
        </div>
      )}

      <section className="flex px-4 py-4 @container">
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
                {card.author.department}
              </p>
              {card.author.gender === "male" && (
                <span className="material-symbols-outlined text-blue-500">
                  male
                </span>
              )}
              {card.author.gender === "female" && (
                <span className="material-symbols-outlined text-pink-500">
                  female
                </span>
              )}
            </div>
            {card.author.instagramId && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-neutral-400">
                <a
                  href={`https://www.instagram.com/${card.author.instagramId}`}
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
                  <span>{card.author.instagramId}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-4 @container">
        <div className="rounded-xl bg-white p-4 dark:bg-neutral-900">
          <p className="mb-3 text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
            자기소개
          </p>
          <p className="text-base text-slate-600 dark:text-neutral-400">
            {card.description}
          </p>
        </div>
      </section>

      {card.author.interests && card.author.interests.length > 0 && (
        <section className="px-4 py-4 @container">
          <div className="rounded-xl bg-white p-4 dark:bg-neutral-900">
            <p className="mb-3 text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
              관심사
            </p>
            <div className="flex flex-wrap gap-2">
              {card.author.interests.map((interest) => (
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
                if (item.id === "explore") {
                  navigate("/matching");
                } else if (item.id === "notifications") {
                  navigate("/matching", {
                    state: { defaultTab: "notifications" }, // 알림 탭을 기본으로 열도록 상태 전달
                  });
                } else if (item.id === "profile") {
                  navigate("/profile");
                }
              }}
              className="flex flex-col items-center justify-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark"
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  fontVariationSettings: "'FILL' 0",
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
