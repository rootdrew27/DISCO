import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export interface MockUser {
  id: string;
  username: string;
  email: string;
  name: string;
  image?: string;
  role?: string;
  reputation?: number;
  expertiseLevel?: number;
}

export class MockJWTGenerator {
  private secret: string;
  private users: MockUser[] = [];

  constructor(secret: string) {
    this.secret = secret;
    this.generateMockUsers();
  }

  private generateMockUsers() {
    const firstNames = [
      "Alex",
      "Jordan",
      "Taylor",
      "Casey",
      "Morgan",
      "Riley",
      "Sam",
      "Dakota",
      "Avery",
      "Quinn",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];
    const topics = [
      "Technology",
      "Politics",
      "Science",
      "Philosophy",
      "Economics",
      "Environment",
      "Health",
      "Education",
    ];

    for (let i = 1; i <= 100; i++) {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;

      this.users.push({
        id: `user-${i}`,
        username,
        email: `${username}@example.com`,
        name: `${firstName} ${lastName}`,
        image: `https://avatar.example.com/${username}`,
        role: "user",
        reputation: Math.floor(Math.random() * 1000) + 100,
        expertiseLevel: Math.floor(Math.random() * 5) + 1,
      });
    }
  }

  generateToken(userId: string): string {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, this.secret, {
      algorithm: "HS256",
      expiresIn: "30d",
    });
  }

  generateRandomToken(): string {
    const randomUser =
      this.users[Math.floor(Math.random() * this.users.length)];
    return this.generateToken(randomUser.id);
  }

  getUser(userId: string): MockUser | undefined {
    return this.users.find((u) => u.id === userId);
  }

  getAllUsers(): MockUser[] {
    return [...this.users];
  }

  verifyToken(token: string): MockUser | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      return this.getUser(decoded.id) || null;
    } catch (error) {
      return null;
    }
  }
}

dotenv.config({ path: ".env.local" });

export const mockJWTGenerator = new MockJWTGenerator(process.env.AUTH_SECRET!);
