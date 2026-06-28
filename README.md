# 여울 공유 가계부

Vercel에 배포하는 React 가계부입니다. 거래, 예산, 회사 정보는 Supabase에 저장되며 접속 중인 팀원 화면에 실시간으로 반영됩니다. 화면에는 공용 사이트 암호만 표시되고, 인증되지 않은 사용자는 데이터에 접근할 수 없습니다.

## 최초 설정

### 1. Supabase 프로젝트와 테이블 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트를 만듭니다.
2. `SQL Editor`에서 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 실행합니다.
3. `Authentication > Users > Add user`에서 공용 계정 하나를 만듭니다.
   - 이메일: 실제 수신용이 아니어도 되지만 기억할 수 있는 주소를 사용합니다.
   - 비밀번호: 팀원들이 사이트에서 입력할 공용 암호입니다.
4. 외부 가입을 막으려면 `Authentication` 설정에서 신규 사용자 가입을 비활성화합니다.

### 2. Vercel 환경변수 등록

Supabase 프로젝트의 `Project URL`과 **Publishable key**를 확인한 뒤 Vercel의 `Project Settings > Environment Variables`에 등록합니다.

```env
VITE_SUPABASE_URL=https://프로젝트-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SHARED_ACCOUNT_EMAIL=위에서_만든_공용계정_이메일
```

`service_role` 키는 절대로 등록하지 마세요. 환경변수를 저장한 뒤 Vercel에서 새 배포를 실행해야 값이 반영됩니다.

### 3. 기존 브라우저 데이터 옮기기

새 배포본을 기존과 같은 Vercel 주소로 열면 `데이터 관리/백업` 메뉴에 **기존 장부를 공유 DB로 이전** 버튼이 표시됩니다. 공유할 기준 데이터가 들어 있는 브라우저에서 한 명만 실행하세요.

안전을 위해 배포 전 기존 화면에서 JSON 백업도 다운로드해 두는 것을 권장합니다. 자동 감지가 되지 않으면 새 화면의 `백업 데이터 복원하기`에서 그 JSON 파일을 업로드할 수 있습니다.

업로드 후부터는 브라우저별 `localStorage`가 아니라 하나의 공유 DB를 사용합니다.

## 로컬 실행

`.env.example`을 `.env.local`로 복사하고 실제 값을 넣은 다음 실행합니다.

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run build
npm run lint
```
