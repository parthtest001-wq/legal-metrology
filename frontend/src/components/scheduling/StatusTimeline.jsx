// /frontend/src/components/scheduling/StatusTimeline.jsx
// Owned by Module 3.
// Visualizes an Application's progress through the APPLICATION_STATUS enum
// (Master Spec Section 7). 'rejected' and 'cancelled' are terminal side-states
// rendered as a distinct final step rather than forced onto the happy path.

const HAPPY_PATH = ['submitted', 'scheduled', 'in_progress', 'completed'];
const TERMINAL_NEGATIVE = ['rejected', 'cancelled'];

const LABELS = {
  submitted: 'Submitted',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export default function StatusTimeline({ status }) {
  const isNegative = TERMINAL_NEGATIVE.includes(status);

  // How far along the happy path we've gotten, even if the application
  // ultimately ended in a negative terminal state.
  const negativeAtIndex = isNegative
    ? // best-effort: rejected can occur from 'scheduled' or 'in_progress';
      // we don't have prior-status history in this model, so just show all
      // happy-path steps as incomplete and append the negative state.
      HAPPY_PATH.length
    : HAPPY_PATH.indexOf(status);

  const steps = isNegative ? [...HAPPY_PATH.slice(0, -1), status] : HAPPY_PATH;
  const activeIndex = isNegative ? steps.length - 1 : negativeAtIndex;

  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const reached = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const stepIsNegative = isNegative && i === steps.length - 1;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  stepIsNegative
                    ? 'bg-red-500 text-white'
                    : reached
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500',
                  isCurrent ? 'ring-2 ring-offset-2 ring-blue-300' : '',
                ].join(' ')}
              >
                {i + 1}
              </div>
              <span
                className={`mt-1 text-xs text-center whitespace-nowrap ${
                  reached ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {LABELS[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  i < activeIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
