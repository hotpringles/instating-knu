import { useState } from "react";
import { useNavigate } from "react-router-dom"; // React Router의 네비게이트 import
import { useData } from "../context/DataContext";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({ studentId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // useNavigate 훅 사용
  const { login } = useData(); // DataContext에서 login 함수 가져오기

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); // 이전 에러 메시지 초기화

    // DataContext의 login 함수 호출
    const result = await login(formValues.studentId, formValues.password);

    if (result.success) {
      // 성공 시, 반환된 경로로 이동
      navigate(result.redirect);
    } else {
      // 실패 시 에러 메시지 표시
      setError(result.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-background-light font-display shadow-lg dark:bg-background-dark">
      <div className="flex w-full flex-col items-center">
        <main className="flex w-full flex-col justify-center px-4 pt-16 sm:pt-24">
          <div className="flex justify-center pb-6">
            <svg
              className="text-primary"
              fill="none"
              height="64"
              width="64"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h1 className="pb-8 text-center text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            KNU 과팅
          </h1>
          <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-slate-700 dark:text-gray-300">
                학번
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500 dark:text-gray-400">
                  badge
                </span>
                <input
                  type="text"
                  name="studentId"
                  value={formValues.studentId}
                  onChange={handleChange}
                  placeholder="학번을 입력하세요"
                  className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-12 pr-4 text-base text-text-light placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:bg-subtle-dark dark:text-text-dark dark:placeholder:text-text-dark/50"
                  required
                  autoComplete="off"
                />
              </div>
            </label>
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-slate-700 dark:text-gray-300">
                비밀번호
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500 dark:text-gray-400">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formValues.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요"
                  className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-12 pr-12 text-base text-text-light placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:bg-subtle-dark dark:text-text-dark dark:placeholder:text-text-dark/50"
                  required
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="flex items-center text-slate-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                    aria-label={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 표시"
                    }
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
            </label>
            {error && (
              <p className="text-sm font-medium text-red-500 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex flex-col items-stretch gap-3 pt-4 pb-16">
              <button
                type="submit"
                className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-5 text-base font-bold leading-normal tracking-[0.015em] text-white transition-opacity hover:opacity-90"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 px-5 text-base font-bold leading-normal tracking-[0.015em] text-primary transition-colors hover:bg-primary/30"
              >
                회원가입
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
