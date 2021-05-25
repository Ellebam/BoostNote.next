import React from 'react'
import styled from '../../shared/lib/styled'
import {
  border,
  selectStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../../shared/lib/styled/styleFunctions'

interface FormHeadingProps {
  depth?: number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

function getHeadingByDepth(depth?: number) {
  switch (depth) {
    case 6:
      return 'h6'
    case 5:
      return 'h5'
    case 4:
      return 'h4'
    case 3:
      return 'h3'
    case 2:
      return 'h2'
    case 1:
    default:
      return 'h1'
  }
}

export const FormHeading = ({
  depth,
  children,
  className,
  style,
}: FormHeadingProps) => {
  const elementName = getHeadingByDepth(depth)

  return React.createElement(elementName, { className, style }, children)
}

export const FormGroup = styled.div`
  margin-bottom: 1rem;
  &:last-child {
    margin-bottom: 0;
  }
`
export const FormControlGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
  &:last-child {
    margin-bottom: 0;
  }
`

export const FormLabel = styled.label`
  display: inline-block;
  margin-bottom: 0.5rem;
`

export const FormTextInput = styled.input`
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  ${border};
  background-color: white;
  &:disabled {
    color: gray;
    background-color: #ccc;
  }
`

export const FormBlockquote = styled.blockquote<{
  variant?: 'primary' | 'danger'
}>`
  border-left: 4px solid
    ${({ theme, variant }) => {
      switch (variant) {
        case 'danger':
          return theme.colors.variants.danger.base
        case 'primary':
        default:
          return theme.colors.variants.primary.base
      }
    }};
  margin-left: 0;
  padding: 0.5em 1em;

  a {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

export const FormCheckInlineItemContainer = styled.div`
  display: inline-flex;
  align-items: center;
  padding-left: 0;
  margin-right: 0.75rem;
`

export const FormCheckInput = styled.input`
  margin-top: 0;
  margin-right: 0.3125rem;
  margin-left: 0;
`

export const FormCheckLabel = styled.label`
  display: inline-block;
  margin-bottom: 0;
`

interface FormCheckItemProps {
  children?: React.ReactNode
  id: string
  type?: 'radio' | 'checkbox'
  checked?: boolean
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export const FormCheckInlineItem = ({
  children,
  id,
  type = 'checkbox',
  checked,
  className,
  style,
  disabled,
  onChange,
}: FormCheckItemProps) => {
  return (
    <FormCheckInlineItemContainer className={className} style={style}>
      <FormCheckInput
        type={type}
        id={id}
        onChange={onChange}
        checked={checked}
        disabled={disabled}
      />
      <FormCheckLabel htmlFor={id}>{children}</FormCheckLabel>
    </FormCheckInlineItemContainer>
  )
}

export const FormCheckItemContainer = styled.div`
  align-items: center;
`

export const FormCheckItem = ({
  children,
  id,
  type = 'checkbox',
  checked,
  className,
  style,
  disabled,
  onChange,
}: FormCheckItemProps) => {
  return (
    <FormCheckItemContainer className={className} style={style}>
      <FormCheckInput
        type={type}
        id={id}
        onChange={onChange}
        checked={checked}
        disabled={disabled}
      />
      <FormCheckLabel htmlFor={id}>{children}</FormCheckLabel>
    </FormCheckItemContainer>
  )
}

export const FormCheckList = styled.div``

export const FormPrimaryButton = styled.button`
  ${primaryButtonStyle};
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  margin-left: 0.375rem;
  &:first-child {
    margin-left: 0;
  }
`

export const FormSecondaryButton = styled.button`
  ${secondaryButtonStyle};
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  margin-left: 0.375rem;
  &:first-child {
    margin-left: 0;
  }
`

export const FormTransparentButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  margin-left: 0.375rem;
  cursor: pointer;
  &:first-child {
    margin-left: 0;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.secondary};
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`

export const FormSelect = styled.select`
  ${selectStyle};
  padding: 0 16px;
  width: 200px;
  height: 32px;
  border-radius: 2px;
  font-size: 14px;
`

export const FormField = styled.div`
  padding: 1rem;
  border-radius: 0.25rem;
  ${border}
`

export const FormLabelGroup = styled.div`
  margin-bottom: 1rem;
  min-height: 32px;
  &:last-child {
    margin-bottom: 0;
  }
  justify-content: flex-end;
  display: flex;
  align-items: center;
`

export const FormLabelGroupLabel = styled.label`
  display: flex;
  align-items: center;
  min-width: 140px;
`
export const FormLabelGroupContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`
