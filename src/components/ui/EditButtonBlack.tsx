import React from 'react';
import styled from 'styled-components';

type BackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const Button = ({ children = "Edit", ...props }: BackButtonProps) => {
  return (
    <StyledWrapper>
      <button className="button" type="button" {...props}>
        <div className="text">{children}</div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    background-color: #212121;
    color: #ffffff;
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
    background-color: #3f4328;
    color: #ffffff;
    cursor: pointer;
  }

  .text {
    display: inline-block;
  }`;

export default Button;
