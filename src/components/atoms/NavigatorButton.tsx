import React from 'react'
import Icon from './Icon'
import styled from '../../shared/lib/styled'

const ButtonContainer = styled.button`
  width: 24px;
  height: 24px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: transparent;
  border-radius: 50%;
  border: none;
  cursor: pointer;

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.colors.text.primary};
  &:hover {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  &:active,
  &.active {
    color: ${({ theme }) => theme.colors.text.link};
  }
`

interface NavigatorButtonProps {
  active?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onContextMenu?: React.MouseEventHandler<HTMLButtonElement>
  iconPath: string
  spin?: boolean
  title?: string
}

const NavigatorButton = ({
  active,
  onClick,
  onContextMenu,
  iconPath,
  title,
  spin,
}: NavigatorButtonProps) => {
  return (
    <ButtonContainer
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      className={active ? 'active' : ''}
    >
      <Icon path={iconPath} spin={spin} />
    </ButtonContainer>
  )
}

export default NavigatorButton
