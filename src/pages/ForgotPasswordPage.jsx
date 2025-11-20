import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [formValues, setFormValues] = useState({
    name: "",
    studentId: "",
    department: "",
    instagramId: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setTempPassword("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setSuccessMessage(data.message);
      setTempPassword(data.tempPassword);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background-light p-4 font-display shadow-lg dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center">
        <button onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-3xl text-text-light dark:text-text-dark">
            arrow_back
          </span>
        </button>
        <h1 className="flex-1 pr-12 text-center text-xl font-bold">
          비밀번호 찾기
        </h1>
      </header>
      <main className="flex-grow pt-8">
        {tempPassword ? (
          <div className="text-center">
            <p className="text-green-600 dark:text-green-400">
              {successMessage}
            </p>
            <p className="mt-4 text-lg">
              임시 비밀번호:{" "}
              <strong className="text-primary">{tempPassword}</strong>
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-8 h-12 w-full rounded-full bg-primary text-lg font-bold text-white"
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              회원가입 시 입력했던 정보를 모두 입력해주세요.
            </p>
            <input
              name="name"
              onChange={handleChange}
              placeholder="이름"
              className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-4 pr-4 text-base dark:bg-subtle-dark"
              required
            />
            <input
              name="studentId"
              onChange={handleChange}
              placeholder="학번"
              className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-4 pr-4 text-base dark:bg-subtle-dark"
              required
            />
            <input
              name="department"
              onChange={handleChange}
              placeholder="학과"
              className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-4 pr-4 text-base dark:bg-subtle-dark"
              required
            />
            <input
              name="instagramId"
              onChange={handleChange}
              placeholder="인스타 아이디"
              className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-4 pr-4 text-base dark:bg-subtle-dark"
              required
            />
            {error && <p className="text-red-500">{error}</p>}
            <button
              type="submit"
              className="h-14 w-full rounded-full bg-primary text-lg font-bold text-white"
            >
              임시 비밀번호 발급
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
