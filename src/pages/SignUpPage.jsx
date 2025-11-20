import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";

const initialInterestOptions = [
  { id: "exercise", label: "#운동" },
  { id: "travel", label: "#여행" },
  { id: "movie", label: "#영화감상" },
  { id: "music", label: "#음악" },
  { id: "food", label: "#맛집탐방" },
  { id: "book", label: "#독서" },
  { id: "pet", label: "#반려동물" },
];

const DEFAULT_SELECTED = [];

export default function SignUpPage() {
  const { userProfile, updateUserProfile } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.isEditMode || false;
  const [photoFile, setPhotoFile] = useState(null); // 실제 파일 객체를 저장할 상태
  const [photo, setPhoto] = useState(null);
  const [interestOptions, setInterestOptions] = useState(
    initialInterestOptions
  );
  const [selectedInterests, setSelectedInterests] = useState(DEFAULT_SELECTED);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState(""); // 비밀번호 상태 추가
  const [gender, setGender] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 수정 모드일 때, props로 받은 userProfile 데이터로 폼 상태를 설정합니다.
    if (isEditMode && userProfile) {
      setName(userProfile.name || "");
      setStudentId(userProfile.studentId || "");
      setGender(userProfile.gender || "");
      setDepartment(userProfile.department || "");
      setInstagramId(userProfile.instagramId || "");
      if (userProfile.photo) {
        const base = import.meta.env.VITE_API_URL;
        const full = userProfile.photo.startsWith("http")
          ? userProfile.photo
          : `${base}${userProfile.photo}`;
        setPhoto(full);
      }
      // userProfile.interests는 ['#운동', '#여행'] 같은 레이블 배열입니다.
      // 이를 ['exercise', 'travel'] 같은 ID 배열로 변환해야 합니다.
      const interestIds =
        userProfile.interests
          ?.map(
            (label) => interestOptions.find((opt) => opt.label === label)?.id
          )
          .filter(Boolean) || DEFAULT_SELECTED;
      setSelectedInterests(interestIds);
    }
  }, [isEditMode, userProfile]);

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setPhoto(null);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
      setPhotoFile(file); // 파일 객체 저장
    }
  };

  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleAddInterest = () => {
    const newLabel = window.prompt(
      "추가할 관심사를 입력하세요 (예: #영화감상)"
    );

    if (!newLabel || newLabel.trim() === "") {
      return;
    }

    const trimmedLabel = newLabel.trim();
    const newId = trimmedLabel.replace("#", "").toLowerCase();

    if (interestOptions.some((option) => option.id === newId)) {
      alert("이미 존재하는 관심사입니다.");
      return;
    }

    const newInterest = { id: newId, label: trimmedLabel };
    setInterestOptions((prev) => [...prev, newInterest]);
    setSelectedInterests((prev) => [...prev, newId]);
  };

  const handleStart = async () => {
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!studentId.trim()) {
      alert("학번을 입력해주세요.");
      return;
    }
    // 회원가입 시에만 비밀번호 유효성 검사
    if (!isEditMode && !password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    if (!isEditMode && !/^\d+$/.test(studentId)) {
      alert("학번은 숫자로만 입력해주세요.");
      return;
    }
    // 학번이 '202'로 시작하는지 프론트엔드에서 검사
    if (!isEditMode && !studentId.startsWith("202")) {
      alert("학번을 다시 확인해주세요.");
      return;
    }
    if (!gender) {
      alert("성별을 선택해주세요.");
      return;
    }
    if (!department.trim()) {
      alert("학과를 입력해주세요.");
      return;
    }
    if (!instagramId.trim()) {
      alert("인스타 아이디를 입력해주세요.");
      return;
    }
    if (!photo) {
      alert("프로필 사진을 등록해주세요.");
      return;
    }

    // FormData 객체 생성
    const formData = new FormData();
    formData.append("name", name);
    formData.append("studentId", studentId);
    formData.append("department", department);
    formData.append("gender", gender);
    formData.append("instagramId", instagramId);
    if (photoFile) {
      formData.append("photo", photoFile);
    }
    // 관심사 목록을 JSON 문자열 형태로 추가
    // interestOptions에서 id에 해당하는 label을 찾아 배열로 만듭니다.
    const selectedInterestLabels = selectedInterests.map(
      (id) => interestOptions.find((opt) => opt.id === id)?.label || ""
    );
    formData.append("interests", JSON.stringify(selectedInterestLabels));

    try {
      if (isEditMode) {
        // 프로필 수정 API 호출
        await updateUserProfile(formData);
        alert("프로필이 수정되었습니다.");
        navigate("/profile"); // 수정 완료 후 프로필 페이지로 이동
      } else {
        formData.append("password", password);
        // 회원가입 API 호출
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/signup`,
          {
            method: "POST",
            // FormData를 사용할 때는 Content-Type 헤더를 설정하지 않음
            // 브라우저가 자동으로 multipart/form-data로 설정해줌
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // 서버에서 보낸 에러 메시지를 표시
          throw new Error(data.message || "회원가입에 실패했습니다.");
        }

        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        navigate("/login");
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      alert(error.message);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background-light text-text-light shadow-lg dark:bg-background-dark dark:text-text-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-center bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <h1 className="text-xl font-bold tracking-tight">
          {isEditMode ? "프로필 수정" : "회원가입"}
        </h1>
      </header>
      <main className="flex-grow px-4">
        <section className="py-4">
          <h2 className="pb-4 text-lg font-bold tracking-tight">기본 정보</h2>
          <div className="flex flex-col gap-4">
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                이름
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                  person
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => !isEditMode && setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  disabled={isEditMode}
                  className={`form-input h-14 w-full rounded-lg border-none pl-12 pr-4 text-base placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:placeholder:text-text-dark/50 ${
                    isEditMode
                      ? "bg-subtle-light/70 text-text-light/70 dark:bg-subtle-dark/70 dark:text-text-dark/70"
                      : "bg-subtle-light text-text-light dark:bg-subtle-dark dark:text-text-dark"
                  }`}
                />
              </div>
            </label>
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                학번
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                  badge
                </span>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => !isEditMode && setStudentId(e.target.value)}
                  placeholder="학번을 입력하세요"
                  disabled={isEditMode}
                  className={`form-input h-14 w-full rounded-lg border-none pl-12 pr-4 text-base placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:placeholder:text-text-dark/50 ${
                    isEditMode
                      ? "bg-subtle-light/70 text-text-light/70 dark:bg-subtle-dark/70 dark:text-text-dark/70"
                      : "bg-subtle-light text-text-light dark:bg-subtle-dark dark:text-text-dark"
                  }`}
                />
              </div>
            </label>
            {/* 회원가입 시 비밀번호 입력 필드 추가 */}
            {!isEditMode && (
              <label className="flex w-full flex-col">
                <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                  비밀번호
                </p>
                <div className="relative flex w-full items-center">
                  <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                    lock
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-12 pr-4 text-base text-text-light placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:bg-subtle-dark dark:text-text-dark dark:placeholder:text-text-dark/50"
                  />
                </div>
              </label>
            )}
            <div>
              <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                성별
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => !isEditMode && setGender("male")}
                  disabled={isEditMode}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    gender === "male"
                      ? "border border-transparent bg-primary text-white"
                      : `border border-subtle-light bg-transparent ${
                          isEditMode
                            ? "text-text-light/40 dark:text-text-dark/40 dark:border-subtle-dark"
                            : "text-text-secondary-light dark:border-subtle-dark dark:text-text-secondary-dark"
                        }`
                  }`}
                >
                  남자
                </button>
                <button
                  type="button"
                  onClick={() => !isEditMode && setGender("female")}
                  disabled={isEditMode}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    gender === "female"
                      ? "border border-transparent bg-primary text-white"
                      : `border border-subtle-light bg-transparent ${
                          isEditMode
                            ? "text-text-light/40 dark:text-text-dark/40 dark:border-subtle-dark"
                            : "text-text-secondary-light dark:border-subtle-dark dark:text-text-secondary-dark"
                        }`
                  }`}
                >
                  여자
                </button>
              </div>
            </div>
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                학과
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                  school
                </span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => !isEditMode && setDepartment(e.target.value)}
                  placeholder="학과를 입력하세요"
                  disabled={isEditMode}
                  className={`form-input h-14 w-full rounded-lg border-none pl-12 pr-4 text-base placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:placeholder:text-text-dark/50 ${
                    isEditMode
                      ? "bg-subtle-light/70 text-text-light/70 dark:bg-subtle-dark/70 dark:text-text-dark/70"
                      : "bg-subtle-light text-text-light dark:bg-subtle-dark dark:text-text-dark"
                  }`}
                />
              </div>
            </label>
            <label className="flex w-full flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-text-light/70 dark:text-text-dark/70">
                인스타 아이디
              </p>
              <div className="relative flex w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-text-light/50 dark:text-text-dark/50">
                  alternate_email
                </span>
                <input
                  type="text"
                  value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)}
                  placeholder="인스타그램 아이디를 입력하세요"
                  className="form-input h-14 w-full rounded-lg border-none bg-subtle-light pl-12 pr-4 text-base text-text-light placeholder:text-text-light/50 focus:ring-2 focus:ring-primary dark:bg-subtle-dark dark:text-text-dark dark:placeholder:text-text-dark/50"
                />
              </div>
            </label>
          </div>
        </section>
        <section className="py-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-bold tracking-tight">내 사진</h2>
          </div>
          <p className="pb-4 text-sm font-normal text-text-light/70 dark:text-text-dark/70">
            당신을 잘 보여줄 수 있는 사진을 올려주세요.
          </p>
          <div className="w-40 cursor-pointer" onClick={handlePhotoClick}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {photo ? (
              <div className="relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-primary bg-primary/10">
                <img
                  alt="선택된 프로필 사진"
                  className="h-full w-full rounded-xl object-cover"
                  src={photo}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-md dark:bg-background-dark"
                  aria-label="사진 삭제"
                >
                  <span className="material-symbols-outlined text-lg text-primary">
                    cancel
                  </span>
                </button>
              </div>
            ) : (
              <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-dashed border-text-light/30 bg-subtle-light text-text-light/50 transition hover:border-primary hover:text-primary dark:border-text-dark/30 dark:bg-subtle-dark dark:text-text-dark/50">
                <span className="material-symbols-outlined text-4xl">
                  add_photo_alternate
                </span>
              </div>
            )}
          </div>
        </section>
        <section className="py-4">
          <h2 className="pb-2 text-lg font-bold tracking-tight">관심사</h2>
          <p className="pb-4 text-sm font-normal text-text-light/70 dark:text-text-dark/70">
            같은 관심사를 가진 사람과 연결될 확률이 높아져요!
          </p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <button
                  type="button"
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    isSelected
                      ? "border border-primary bg-primary/20 text-primary"
                      : "border border-subtle-light bg-transparent text-text-light/70 dark:border-subtle-dark dark:text-text-dark/70"
                  }`}
                >
                  {interest.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddInterest}
              className="flex items-center gap-1 rounded-full border border-dashed border-text-light/50 px-4 py-2 text-sm font-medium text-text-light/70 dark:border-text-dark/50 dark:text-text-dark/70"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>직접 추가</span>
            </button>
          </div>
        </section>
      </main>
      <footer className="sticky bottom-0 bg-gradient-to-t from-background-light px-4 pt-4 pb-8 dark:from-background-dark">
        <button
          type="button"
          onClick={handleStart}
          className="h-14 w-full rounded-full bg-primary text-lg font-bold text-white shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          {isEditMode ? "수정 완료" : "시작하기"}
        </button>
      </footer>
    </div>
  );
}
