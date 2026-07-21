// ============================================================
// 방탈출 방향 자물쇠 설정 파일
// 스테이지(자물쇠)를 추가/수정하려면 이 파일만 고치면 됩니다.
//
// - key: URL에 붙는 스테이지 번호 (예: ?stage=1)
// - title: 화면 상단에 표시될 제목
// - password: (선택) 값을 넣으면 index.html이 성경구절 입력 대신 비밀번호 입력 화면으로 바뀝니다.
//             정답 비밀번호를 입력하면 화살표를 보여준 뒤 자동으로 direction-lock.html로 이동합니다.
// - openMessage: direction-lock.html에서 자물쇠가 열렸을 때 보여줄 문구 (선택, 없으면 기본 문구 사용)
// - revealPhone: (선택) direction-lock.html에서 자물쇠가 열렸을 때 화면에 표시할 전화번호
// - skipVerseApp: (선택) true면 admin.html의 QR 목록에서 index.html(성경구절/비밀번호 입력) QR을
//                 만들지 않습니다. 정답을 다른 물리적 단서에서 얻는 스테이지에 사용하세요.
// - reveal: (선택) direction-lock.html에서 자물쇠가 열렸을 때 영상 2개를 보여주고,
//           둘 다 끝까지 재생되면 최종 코드 화면으로 넘어가게 합니다.
//     - type: "videos" 로 고정
//     - videos: [{ label: 영상 위에 표시할 제목, src: 영상 파일 경로(videos/ 폴더에 넣으세요) }, ...]
//     - finalTitle: 두 영상이 모두 끝난 뒤 보여줄 제목
//     - finalCode: 그 아래에 크게 보여줄 코드/비밀번호
// - verses: 정답으로 인정할 구절들의 목록 (password가 없는 스테이지에서 사용)
//     - refs: 같은 구절을 표기하는 여러 방식(오타/축약 포함)을 배열로 등록
//             입력값과 refs 중 하나라도 일치하면 정답 처리됩니다.
//             (공백/대소문자/일부 문장부호는 자동으로 무시되고 비교됩니다)
//     - arrows: 정답 방향 순서. index.html에서는 이 순서를 화면에 보여주고,
//               direction-lock.html에서는 이 순서를 직접 입력해야 자물쇠가 열립니다.
//               "up" | "down" | "left" | "right" 중에서 원하는 만큼 나열
// ============================================================

const STAGES = {
  "1": {
    title: "첫 번째 자물쇠",
    password: "0925",
    openMessage: "잠금 해제!",
    revealPhone: "010-1234-5678",
    verses: [
      {
        refs: ["요한복음 3:16", "요 3:16", "요3:16", "요한복음3장16절"],
        arrows: ["up", "up", "right", "down"],
      },
    ],
  },
  "2": {
    title: "두 번째 자물쇠",
    skipVerseApp: true,
    reveal: {
      type: "videos",
      videos: [
        { label: "CCTV 영상", src: "videos/cctv.mp4" },
        { label: "비밀 연구 프로젝트의 정체", src: "videos/identity.mp4" },
      ],
      finalTitle: "E.D.E.N Project",
      finalCode: "4213",
    },
    verses: [
      {
        refs: ["시편 23:1", "시 23:1", "시23:1", "시편23편1절"],
        arrows: ["left", "up", "right", "right", "down"],
      },
    ],
  },
  // 아래처럼 계속 추가하면 됩니다.
  // "3": {
  //   title: "세 번째 자물쇠",
  //   verses: [
  //     { refs: ["로마서 8:28", "롬 8:28"], arrows: ["down", "left", "up"] },
  //   ],
  // },
};
