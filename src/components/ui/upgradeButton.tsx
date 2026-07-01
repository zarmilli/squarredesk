import React from 'react';
import styled from 'styled-components';

type UpgradeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const Button = ({ children = "Unlock Pro", className, ...props }: UpgradeButtonProps) => {
  return (
    <StyledWrapper>
      <button className={["button", className].filter(Boolean).join(" ")} type="button" {...props}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24">
          <path d="m18 0 8 12 10-8-4 20H4L0 4l10 8 8-12z" />
        </svg>
        {children}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    width: 100%;
    min-width: fit-content;
    height: 2.4em;
    display: flex;
    padding: 0.4em 1em;
    cursor: pointer;
    gap: 0.4rem;
    font-weight: bold;
    border-radius: 8px;
    text-shadow: 2px 2px 3px rgb(136 0 136 / 50%);
    background: linear-gradient(15deg, #880088, #aa2068, #cc3f47, #de6f3d, #f09f33, #de6f3d, #cc3f47, #aa2068, #880088) no-repeat;
    background-size: 300%;
    color: #fff;
    border: none;
    background-position: left center;
    box-shadow: 0 30px 10px -20px rgba(0,0,0,.2);
    transition: background .3s ease;
  }

  .button:hover {
    background-size: 320%;
    background-position: right center;
  }

  .button:hover svg {
    fill: #fff;
  }

  .button svg {
    width: 23px;
    fill: #f09f33;
    transition: .3s ease;
  }`;

export default Button;
