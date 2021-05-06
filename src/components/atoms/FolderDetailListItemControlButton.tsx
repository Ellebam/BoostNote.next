import React, { MouseEventHandler } from 'react'
import Icon from './Icon'
import styled from '../../shared/lib/styled'

interface FolderDetailListItemControlButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>
  iconPath: string
  title?: string
  active?: boolean
}

const FolderDetailListItemControlButton = ({
  onClick,
  title,
  iconPath,
  active = false,
}: FolderDetailListItemControlButtonProps) => {
  return (
    <Container
      className={active ? 'active' : ''}
      onClick={onClick}
      title={title}
    >
      <Icon path={iconPath} />
    </Container>
  )
}

export default FolderDetailListItemControlButton

const Container = styled.button`
  width: 32px;
  height: 32px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: transparent;
  border-radius: 50%;
  border: none;
  cursor: pointer;

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.colors.text.secondary};
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &:active,
  &.active {
    color: ${({ theme }) => theme.colors.text.link};
  }
`
