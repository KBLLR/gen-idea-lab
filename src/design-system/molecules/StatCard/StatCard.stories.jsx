import { StatCard } from './StatCard';

export default { title: 'UI/Molecules/StatCard', component: StatCard, parameters: { layout: 'centered' } };

export const Info    = { args: { icon: 'ℹ️', value: '42', label: 'Open PRs', tone: 'info' } };
export const Success = { args: { icon: '✅', value: '9',  label: 'Checks Passing', tone: 'success' } };
export const Warn    = { args: { icon: '⚠️', value: '3',  label: 'Flaky Tests', tone: 'warn' } };
export const Danger  = { args: { icon: '⛔', value: '1',  label: 'Prod Incidents', tone: 'danger' } };