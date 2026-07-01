import React from 'react';
import styled from 'styled-components';

type PublishButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const Button = ({ children = "Publish", className, ...props }: PublishButtonProps) => {
  return (
    <StyledWrapper>
      <button className={className} type="button" {...props}>
        <div className="svg-wrapper-1">
          <div className="svg-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18}>
              <path fill="none" d="M0 0h24v24H0z" />
              <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
            </svg>
          </div>
        </div>
        <span>{children}</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    background: linear-gradient(90deg, #ff8a00 0%, #e52e71 100%);
    color: white;
    padding: 0.4em 1em;
    width: 8.5em;
    height: 2.4em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
    gap: 0.35rem;
  }

  button span {
    display: inline-block;
    transition: all 0.3s ease-in-out;
  }

  button svg {
    display: block;
    transform-origin: center center;
    transition: transform 0.3s ease-in-out;
  }

  button:hover .svg-wrapper {
    animation: fly-1 0.6s ease-in-out infinite alternate;
  }

  button:hover svg {
    transform: translateX(-0.4em) rotate(45deg) scale(1.1);
  }

  button:hover span {
    transform: translateX(0.2em);
  }

  button:active {
    transform: scale(0.95);
  }

  @keyframes fly-1 {
    from {
      transform: translateY(0.1em);
    }

    to {
      transform: translateY(-0.1em);
    }
  }`;

export default Button;
