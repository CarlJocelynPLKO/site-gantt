export interface TeamGroup {
  id: string;
  name: string;
  people: Person[];
}

export interface Person {
  id: string;
  groupId: string;
  firstName: string;
  jobTitle: string;
}

export interface TaskAssignee {
  id: string;
  firstName: string;
  jobTitle: string;
}
