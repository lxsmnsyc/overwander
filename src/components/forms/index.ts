/**
 * Questions the game asks, as promises: open a form from anywhere and
 * await the answer. A conversation is a run of them in one dialog,
 * spoken by somebody
 */
export { type ActionForm, type FormProps, defineForm } from './form';
export { openForm } from './stack';
export {
  type Conversation,
  type ConversationHandle,
  type Speaker,
  type StepOptions,
  converse,
} from './conversation';
export { type Choice, type ChoiceInput, choiceForm, choose } from './choice';
export { type PickCatchInput, PickCatchForm, loadCatchOptions } from './pick-catch';
export { type PickItemInput, PickItemForm } from './pick-item';
export { type PickMoveInput, PickMoveForm } from './pick-move';
export { type TeachMoveInput, type Teaching, TeachMoveForm, askTeachings } from './teach-move';
export { type PickBoxInput, PickBoxForm } from './pick-box';
export { type PickTeamInput, PickTeamForm } from './pick-team';
