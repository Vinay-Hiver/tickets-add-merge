import type { AvatarColor } from '../../../components/Avatar'
import type { IconName } from '../../../icons'

/** The choices in the Status field of the top section. The same three for every channel. */
export type StatusOption = { value: 'open' | 'pending' | 'closed'; label: string; icon: IconName }
export const statusOptions: StatusOption[] = [
  { value: 'open', label: 'Open', icon: 'openstatus' },
  { value: 'pending', label: 'Pending', icon: 'pendingstatus' },
  { value: 'closed', label: 'Closed', icon: 'closedstatus' },
]

/** A person who can own a conversation. Example people for the stories; a product would load them. */
export type Assignee = { value: string; label: string; color: AvatarColor; status?: 'online' | 'offline' }
export const sampleAssignees: Assignee[] = [
  { value: 'michael', label: 'Michael Scott (Me)', color: 'red' },
  { value: 'priya', label: 'Priya Sharma', color: 'yellow' },
  { value: 'daniel', label: 'Daniel Kim', color: 'lightBlue' },
  { value: 'sofia', label: 'Sofia Martinez', color: 'purple' },
  { value: 'arjun', label: 'Arjun Mehta', color: 'orange' },
  { value: 'emma', label: 'Emma Wilson', color: 'green' },
  { value: 'liam', label: "Liam O'Brien", color: 'violet' },
]
