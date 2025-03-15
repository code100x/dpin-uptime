import { client } from "../src";

const USER_ID = "4";

async function seed() {
  await client.user.create({
    data: {
      id: USER_ID,
      email: "test@test.com",
    },
  });

  const website = await client.website.create({
    data: {
      url: "https://test.com",
      userId: USER_ID,
    },
  });

  const validator = await client.validator.create({
    data: {
      publicKey: "0x12341223123",
      location: "Delhi",
      ip: "127.0.0.1",
    },
  });

  await client.websiteTick.create({
    data: {
      websiteId: website.id,
      status: "Good",
      createdAt: new Date(),
      latency: 100,
      validatorId: validator.id,
    },
  });

  await client.websiteTick.create({
    data: {
      websiteId: website.id,
      status: "Good",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      latency: 100,
      validatorId: validator.id,
    },
  });

  await client.websiteTick.create({
    data: {
      websiteId: website.id,
      status: "Bad",
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      latency: 100,
      validatorId: validator.id,
    },
  });
}

seed();
