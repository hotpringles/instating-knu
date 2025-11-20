import { createContext, useContext, useState, useCallback } from "react";
import {
  userProfile as initialUserProfile,
  profileStats as initialProfileStats,
} from "../data/mockData";

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [userProfile, _setUserProfile] = useState(initialUserProfile);

  // setUserProfile을 래핑하여 interests가 항상 배열이 되도록 보장
  const setUserProfile = (profile) => {
    _setUserProfile({ ...profile, interests: profile.interests || [] });
  };

  const [matchingGroupCards, setMatchingGroupCards] = useState([]); // 초기값 빈 배열로 변경
  const [notifications, setNotifications] = useState([]); // 초기값 빈 배열로 변경
  const [profileStats] = useState(initialProfileStats);

  // 서버에서 매칭 카드 목록을 불러오는 함수
  const fetchMatchingCards = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matching-cards`
      );
      const data = await response.json();
      if (response.ok) {
        setMatchingGroupCards(data);
      } else {
        throw new Error(data.message || "매칭 카드를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // 서버에 새로운 매칭 카드를 생성하는 함수
  const addMatchingCard = async (cardData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      // 실패 객체 반환
      return { success: false, message: "로그인이 필요합니다." };
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matching-cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cardData),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        // 실패 시, 서버에서 받은 에러 메시지를 담은 객체 반환
        return { success: false, message: data.message };
      }
      // 성공 시, 성공 객체 반환
      return { success: true, message: "매칭 카드가 등록되었습니다." };
    } catch (error) {
      console.error("매칭 카드 추가 오류:", error);
      // 그 외 네트워크 오류 등 발생 시 실패 객체 반환
      return { success: false, message: error.message };
    }
  };

  // 앱 시작 시 토큰으로 현재 사용자 정보를 가져오는 함수
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData); // 코인 정보가 포함된 최신 유저 정보로 업데이트
      } else {
        // 토큰이 유효하지 않은 경우 등
        logout();
      }
    } catch (error) {
      console.error("현재 사용자 정보 로딩 실패:", error);
    }
  }, []);

  const revealCardProfile = async (cardId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return false;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cards/${cardId}/reveal`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUserProfile(data.user); // 코인이 차감된 최신 유저 정보로 업데이트
      return { success: true, user: data.user };
    } catch (error) {
      alert(error.message);
      return { success: false, message: error.message };
    }
  };

  // 서버에서 알림 목록을 불러오는 함수
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("알림 목록 로딩 실패:", error);
    }
  }, []);

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // 성공 시, 클라이언트 상태도 업데이트
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token"); // 브라우저에서 토큰 삭제
    // 사용자 프로필을 초기 상태로 리셋
    _setUserProfile(initialUserProfile);
    // 알림과 매칭 카드 목록도 초기화
    setNotifications([]);
    setMatchingGroupCards([]);
  };

  const updateUserProfile = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUserProfile(data.user); // 수정된 최신 유저 정보로 업데이트
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteMatchingCard = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matching-cards`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert(data.message);
      await fetchMatchingCards(); // 성공 시 카드 목록 새로고침
    } catch (error) {
      console.error("카드 삭제 실패:", error);
      alert(error.message);
    }
  };

  const login = async (studentId, password) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, password }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      // 로그인 성공 시 토큰 저장
      localStorage.setItem("token", data.token);
      // 사용자 정보 업데이트
      setUserProfile(data.user);

      // 역할(role)에 따라 리다이렉트 경로 결정
      if (data.user.role === "ADMIN") {
        return { success: true, redirect: "/admin" };
      } else {
        return { success: true, redirect: "/matching" };
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    userProfile,
    setUserProfile, // 로그인 시 사용자 정보를 업데이트하기 위해 추가
    matchingGroupCards,
    fetchCurrentUser,
    fetchMatchingCards,
    addMatchingCard,
    revealCardProfile,
    profileStats,
    notifications,
    fetchNotifications,
    markAsRead,
    login, // 로그인 함수를 context value에 추가
    logout, // 로그아웃 함수를 context value에 추가
    updateUserProfile,
    deleteMatchingCard,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
