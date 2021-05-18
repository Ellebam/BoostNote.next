import React, { Ref } from 'react'
import { flexCenter } from '../../lib/styled/styleFunctions'
import styled from '../../shared/lib/styled'
import Icon from '../../shared/components/atoms/Icon'

const Container = styled.button`
  height: 32px;
  width: 32px;
  box-sizing: border-box;
  font-size: 18px;
  outline: none;
  padding: 0 5px;

  background-color: transparent;
  ${flexCenter};

  border: none;
  border-radius: 3px;
  cursor: pointer;

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.colors.text.primary};
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.quaternary};
  }
  &:hover,
  &:active,
  &.active {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

interface ToolbarButtonProps {
  iconPath: string
  active?: boolean
  title?: string
  onContextMenu?: React.MouseEventHandler
  onClick: React.MouseEventHandler
}

const ToolbarIconButton = React.forwardRef(
  (
    {
      iconPath,
      onClick,
      onContextMenu,
      active = false,
      title,
    }: ToolbarButtonProps,
    ref: Ref<HTMLButtonElement>
  ) => (
    // <Button
    //   variant='primary'
    //   id='tab_local_btn'
    //   onClick={onClick}
    //   onContextMenu={onContextMenu}
    //   active={active}
    //   ref={ref}
    //   iconSize={20}
    //   iconPath={iconPath}
    // />
    <Container
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={active ? 'active' : ''}
      ref={ref}
      title={title}
    >
      <Icon size={16} path={iconPath} />
    </Container>
  )
)

export default ToolbarIconButton
