import styled from '../../shared/lib/styled'
import {
  selectStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
  tableStyle,
} from '../../shared/lib/styled/styleFunctions'

export const Section = styled.section`
  margin-bottom: 2em;
`

export const SectionHeader = styled.h3`
  font-size: 18px;
  font-weight: 500;
`

export const SectionSubtleText = styled.p`
  color: ${({ theme }) => theme.colors.text.disabled};
`

export const PrimaryAnchor = styled.a`
  color: ${({ theme }) => theme.colors.text.primary};
`

export const SectionMargin = styled.section`
  margin: 100px;
`

export const SectionControl = styled.div`
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  button {
    margin-left: 4px;
    &:first-child {
      margin-left: 0;
    }
  }
`

export const SectionSelect = styled.select`
  ${selectStyle};
  padding: 0 16px;
  width: 200px;
  height: 40px;
  border-radius: 2px;
  font-size: 14px;
`

export const SectionPrimaryButton = styled.button`
  ${primaryButtonStyle};
  padding: 0 16px;
  height: 40px;
  border-radius: 2px;
  cursor: pointer;
  vertical-align: middle;
  align-items: center;
`

export const SectionSecondaryButton = styled.button`
  ${secondaryButtonStyle};
  padding: 0 16px;
  height: 40px;
  border-radius: 2px;
  cursor: pointer;
  align-items: center;
`

export const SectionInput = styled.input`
  ${inputStyle};
  padding: 0 16px;
  width: 200px;
  height: 40px;
  border-radius: 2px;
  font-size: 14px;
`

export const SectionTable = styled.table`
  ${tableStyle}
`

export const SectionListSelect = styled.div`
  ${selectStyle};
  padding: 0 16px;
  width: 200px;
  height: 40px;
  border-radius: 2px;
  font-size: 14px;
`

export const SearchMatchHighlight = styled.span`
  background-color: #ffc107;
  color: #ffdb70;

  padding: 2px;
`
