import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Container from './Container';


describe('renders component', () => {

  test("Remove 'min-h-screen' class when full prop is false ", () => {

    render(<Container full={false} id="testing"></Container>)

    const content = within(screen.getByRole("section")).getByLabelText(/container/i)

    expect(content.className).not.toContain("min-h-screen")

  })

  test("Add 'min-h-screen' class when full prop is true", () => {

    render(<Container full={true}></Container>)

    const content = within(screen.getByRole("section")).getByLabelText(/container/i)


    expect(content.className).toContain("min-h-screen")


  })

  test("Has the correct id", () => {

    render(<Container id="my-test-id"></Container>)

    const section = screen.getByRole("section")

    expect(section.id).toBe("my-test-id")
    
  })

  test("To Display Children", () => {

    const html = (
      <div aria-label='my div'>My Div</div>
    )
    render(<Container>{html}</Container>)

    const div = screen.getByLabelText(/my div/i)

    expect(div).toBeInTheDocument()

  })

});
