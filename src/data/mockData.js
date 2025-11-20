export const matchingGroupCards = [
  // 2:2 매칭 데이터
  {
    id: 101,
    name: "컴공 훈남들",
    image: "https://picsum.photos/seed/group1/400/300",
    description:
      "저희는 컴퓨터공학과 2학년 친구들입니다! 같이 맛있는 거 먹고 재밌게 놀아요. MBTI는 ENFP, ISTJ 조합입니다.",
    matchType: "2v2",
    department: "컴퓨터공학과",
    instagramId: "knu_cse_boys",
    interests: [
      { id: "game", label: "#PC게임" },
      { id: "movie", label: "#영화감상" },
      { id: "food", label: "#맛집탐방" },
    ],
    gender: "male",
  },
  {
    id: 102,
    name: "경영학과 23학번",
    image: "https://picsum.photos/seed/group2/400/300",
    description:
      "안녕하세요! 저희는 활발하고 사람 만나는 걸 좋아하는 경영학과 여자 2명입니다. 예쁜 카페 가는 거 좋아해요!",
    matchType: "2v2",
    department: "경영학과",
    instagramId: "knu_biz_girls",
    interests: [
      { id: "cafe", label: "#카페투어" },
      { id: "travel", label: "#여행" },
      { id: "music", label: "#음악" },
    ],
    gender: "female",
  },
  {
    id: 103,
    name: "체육교육과 동기",
    image: "https://picsum.photos/seed/group3/400/300",
    description:
      "운동 좋아하는 체교과 남자들입니다. 같이 볼링 치거나 맛있는 거 먹으러 갈 분들 구해요! 저희는 E 성향만 있어요.",
    matchType: "2v2",
    department: "체육교육과",
    instagramId: "knu_sports_bros",
    interests: [
      { id: "exercise", label: "#운동" },
      { id: "bowling", label: "#볼링" },
      { id: "food", label: "#맛집탐방" },
    ],
    gender: "male",
  },
  // 3:3 매칭 데이터
  {
    id: 201,
    name: "전자공학부 3인방",
    image: "https://picsum.photos/seed/group4/400/300",
    description:
      "저희는 조용하지만 친해지면 재밌는 전자공학부 남자 3명입니다. 보드게임이나 방탈출 좋아해요. 같이 놀아요!",
    matchType: "3v3",
    department: "전자공학부",
    instagramId: "knu_elec_trio",
    interests: [
      { id: "boardgame", label: "#보드게임" },
      { id: "roomescape", label: "#방탈출" },
      { id: "movie", label: "#영화감상" },
    ],
    gender: "male",
  },
  {
    id: 202,
    name: "간호학과 22학번 동기들",
    image: "https://picsum.photos/seed/group5/400/300",
    description:
      "안녕하세요! 간호학과 여자 3명입니다. 맛있는 음식 먹으면서 스트레스 푸는 거 좋아해요. 저희랑 같이 맛집 탐방 하실 분?",
    matchType: "3v3",
    department: "간호학과",
    instagramId: "knu_nursing_angels",
    interests: [
      { id: "food", label: "#맛집탐방" },
      { id: "dessert", label: "#디저트" },
      { id: "shopping", label: "#쇼핑" },
    ],
    gender: "female",
  },
];

export const swipeableProfiles = []; // 기존 MainPage에서 사용하던 데이터 (현재는 사용되지 않음)

export const userProfile = {
  name: "김민준",
  studentId: "2020123456",
  department: "컴퓨터공학과",
  gender: "male",
  instagramId: "minjun.kim.dev",
  photo: "https://picsum.photos/seed/myprofile/400/400",
  interests: [
    { id: "exercise", label: "#운동" },
    { id: "movie", label: "#영화감상" },
    { id: "food", label: "#맛집탐방" },
  ],
};

export const profileStats = [
  { label: "Profile Views", value: 0 },
  { label: "Matches", value: 0 },
  { label: "Likes Received", value: 12 },
];

export const heroImage = "https://picsum.photos/seed/hero/800/600";

export const notifications = [];

export const revealedProfiles = [];

export const profileInterests = [
  { id: "exercise", label: "#운동" },
  { id: "movie", label: "#영화감상" },
  { id: "food", label: "#맛집탐방" },
];

export const storyItems = [
  {
    id: 1,
    user: {
      name: "컴공 훈남들",
      avatar: "https://picsum.photos/seed/group1/100/100",
    },
    imageUrl: "https://picsum.photos/seed/story1/300/500",
    viewed: false,
  },
  {
    id: 2,
    user: {
      name: "간호학과 동기들",
      avatar: "https://picsum.photos/seed/group5/100/100",
    },
    imageUrl: "https://picsum.photos/seed/story2/300/500",
    viewed: true,
  },
];

export const partnerProfile = {
  name: "박서연",
  age: 22,
  department: "경영학과",
  bio: "안녕하세요! 같이 맛있는 거 먹고 재밌게 놀아요. MBTI는 ENFP입니다.",
  photo: "https://picsum.photos/seed/partner1/400/400",
  interests: [
    { id: "cafe", label: "#카페투어" },
    { id: "travel", label: "#여행" },
    { id: "music", label: "#음악" },
  ],
};

export const chatMessages = [
  {
    id: 1,
    chatRoomId: 1,
    sender: {
      name: "경영학과 23학번",
      avatar: "https://picsum.photos/seed/group2/100/100",
    },
    message: "안녕하세요! 저희랑 과팅하실래요? 😊",
    timestamp: "오후 2:30",
    isRead: false,
  },
  {
    id: 2,
    chatRoomId: 2,
    sender: {
      name: "전자공학부 3인방",
      avatar: "https://picsum.photos/seed/group4/100/100",
    },
    message: "저희 카드 보셨나요? 관심 있으면 연락주세요!",
    timestamp: "오전 11:15",
    isRead: true,
  },
  {
    id: 3,
    chatRoomId: 3,
    sender: {
      name: "운영팀",
      avatar: "https://picsum.photos/seed/admin/100/100",
    },
    message: "InstaTing에 오신 것을 환영합니다! 매너있는 채팅 부탁드려요.",
    timestamp: "어제",
    isRead: true,
  },
];
