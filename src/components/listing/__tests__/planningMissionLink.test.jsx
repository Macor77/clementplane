import React from 'react';
import { expect, test, vi } from 'vitest';
import PlanningMissionLink from '../../planning/PlanningMissionLink';
globalThis.React = React;

test.each([
  { button: 0, ctrlKey: true }, { button: 0, metaKey: true },
  { button: 0, shiftKey: true }, { button: 0, altKey: true },
  { button: 1 }, { button: 2 }, { button: 0, defaultPrevented: true },
])('leaves browser gestures unchanged: %j', gesture => {
  const onPreview = vi.fn();
  const element = PlanningMissionLink({ to: '/missions/demo', onPreview, children: 'Mission' });
  const event = { ...gesture, stopPropagation: vi.fn(), preventDefault: vi.fn() };
  element.props.onClick(event);
  expect(element.props.to).toBe('/missions/demo');
  expect(event.preventDefault).not.toHaveBeenCalled();
  expect(onPreview).not.toHaveBeenCalled();
});
test('plain click opens the existing day preview once', () => {
  const onPreview = vi.fn();
  const element = PlanningMissionLink({ to: '/missions/demo', onPreview });
  const event = { button: 0, stopPropagation: vi.fn(), preventDefault: vi.fn() };
  element.props.onClick(event);
  expect(event.preventDefault).toHaveBeenCalledOnce();
  expect(event.stopPropagation).toHaveBeenCalledOnce();
  expect(onPreview).toHaveBeenCalledExactlyOnceWith(event);
});
