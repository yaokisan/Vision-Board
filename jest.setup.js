import '@testing-library/jest-dom'

// Mock React Flow since it has DOM dependencies
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, ...props }) => <div data-testid="react-flow" {...props}>{children}</div>,
  ReactFlowProvider: ({ children }) => <div data-testid="react-flow-provider">{children}</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  useReactFlow: () => ({
    getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    setViewport: jest.fn(),
    fitView: jest.fn(),
  }),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  Panel: ({ children, ...props }) => <div data-testid="panel" {...props}>{children}</div>,
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  }
})

// Suppress console warnings in tests
global.console.warn = jest.fn()
global.console.error = jest.fn()