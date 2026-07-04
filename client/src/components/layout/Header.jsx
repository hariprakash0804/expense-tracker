import { useTheme } from '../../contexts/ThemeContext';
import { HiOutlineSun, HiOutlineMoon, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import './Header.css';

const Header = ({ title, subtitle, onAddClick, addLabel = 'Add Expense' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header__left">
        <div>
          <h1 className="header__title">{title}</h1>
          {subtitle && <p className="header__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header__right">
        <button
          className="header__theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>

        {onAddClick && (
          <button className="btn btn--primary" onClick={onAddClick}>
            <HiOutlinePlus />
            <span>{addLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
