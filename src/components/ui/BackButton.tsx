import React from 'react';
import styled from 'styled-components';

type BackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const Button = ({ children = "Back", className, ...props }: BackButtonProps) => {
  return (
    <StyledWrapper>
      <button className={["button", className].filter(Boolean).join(" ")} type="button" {...props}>
        <svg className="w-6 h-6" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="text">{children}</div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    background-color: #cbcdd6;
    color: #212121;
    width: 6.5em;
    height: 2.4em;
    padding: 0.4em 1em;
    border-radius: 8px;
    text-align: right;
    transition: all 0.6s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
  }

  .button:hover {
    background-color: #212121;
    color: #ffffff;
    cursor: pointer;
  }

  .button svg {
    width: 1.1rem;
    height: 1.1rem;
    display: block;
    transition: all 0.6s ease;
    transform: rotate(180deg);
    transform-origin: 50% 50%;
    flex-shrink: 0;
  }

  .button:hover svg {
    transform: translate(-5px) rotate(180deg);
    transform-origin: 50% 50%;
  }

  .text {
    display: inline-block;
  }`;

export default Button;
