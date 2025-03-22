import { prismaClient } from "../src";

const RANDOM_NUMBER = Math.random() * 10;

async function seed() {
  const user = await prismaClient.user.create({
    data: {
      email: `test${RANDOM_NUMBER}@test.com`,
    },
  });

  const website = await prismaClient.website.create({
    data: {
      url: `https://test${RANDOM_NUMBER}.com`,
      userId: user.id,
    },
  });

  interface IpInfo {
    ip: string;
    city?: string;
    region?: string;
    country?: string;
    loc?: string; // Latitude and longitude ("37.7749,-122.4194")
  }
  async function getIpAndLocation(): Promise<IpInfo> {
    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      return data as IpInfo;
    } catch (error) {
      const response = await fetch("http://ip-api.com/json/");
      const data = await response.json();
      return {
        ip: data.query,
        city: data.city,
        region: data.regionName,
        country: data.country,
        loc: `${data.lat},${data.lon}`,
      };
    }
  }

  const ipInfo = await getIpAndLocation();

  const validator = await prismaClient.validator.create({
    data: {
      publicKey: "0x12341223123",
      location: ipInfo.city!,
      ip: ipInfo.ip,
    },
  });

  await prismaClient.websiteTick.create({
    data: {
      websiteId: website.id,
      status: "Good",
      createdAt: new Date(),
      latency: 100,
      validatorId: validator.id,
    },
  });

  await prismaClient.websiteTick.create({
    data: {
      websiteId: website.id,
      status: "Good",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      latency: 100,
      validatorId: validator.id,
    },
  });

  await prismaClient.websiteTick.create({
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
