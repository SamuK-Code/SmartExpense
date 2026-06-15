import { InteractionManager } from 'react-native';

const originalRunAfterInteractions = InteractionManager.runAfterInteractions;

InteractionManager.runAfterInteractions = (task) => {
  if (typeof task === 'function') {
    return originalRunAfterInteractions(task);
  }
  return { cancel: () => {} };
};

export default InteractionManager;