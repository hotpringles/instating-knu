import { NavLink } from 'react-router-dom';

export default function Layout({ pages = [], children }) {
  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">KNU InstaTing Prototype</p>
          <h1>주요 화면 JSX 연결</h1>
          <p>
            아래의 내비게이션을 눌러 각각의 정적 디자인 시안을 바로 전환하면서 프로토타입을 확인해
            보세요.
          </p>
        </div>
      </header>
      <nav className="app-nav">
        {pages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            end={page.path === '/'}
            className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
          >
            {page.label}
          </NavLink>
        ))}
      </nav>
      <main className="app-stage">{children}</main>
    </div>
  );
}
