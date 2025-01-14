import React, { useState, useCallback, useEffect, useRef } from 'react'
import Button from '../../../shared/components/atoms/Button'
import styled from '../../../shared/lib/styled'
import Flexbox from '../atoms/Flexbox'
import { useEffectOnce } from 'react-use'

interface CommentInputProps {
  onSubmit: (comment: string) => any
  value?: string
  autoFocus?: boolean
}

export function CommentInput({
  onSubmit,
  value = '',
  autoFocus = false,
}: CommentInputProps) {
  const [comment, setComment] = useState(value)
  const [working, setWorking] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffectOnce(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus()
    }
  })

  useEffect(() => {
    setComment(value)
  }, [value])

  const submit = useCallback(
    async (comment: string) => {
      try {
        setWorking(true)
        await onSubmit(comment)
        setComment('')
      } finally {
        setWorking(false)
      }
    },
    [onSubmit]
  )

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault()
        ev.stopPropagation()

        if (ev.ctrlKey || ev.metaKey) {
          submit(comment)
        } else {
          setComment((val) => `${val}\n`)
        }
      }
    },
    [comment, submit]
  )

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (ev) => {
      setComment(ev.target.value)
    },
    []
  )

  return (
    <InputContainer>
      <textarea
        ref={inputRef}
        disabled={working}
        value={comment}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <Flexbox justifyContent='flex-end'>
        <Button disabled={working} onClick={() => submit(comment)}>
          Post
        </Button>
      </Flexbox>
    </InputContainer>
  )
}

const InputContainer = styled.div`
  width: 100%;
  & textarea {
    resize: none;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.colors.border.second};
    height: 60px;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    padding: 5px 10px;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.df}px;
  }
`

export default CommentInput
