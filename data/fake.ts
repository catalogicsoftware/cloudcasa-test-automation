import { faker } from '@faker-js/faker';

export const fakeUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 16, memorable: false }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
});
