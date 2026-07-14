import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['user', 'admin'] }).default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => {
  return {
    posts: many(posts),
  };
});

export const postsRelations = relations(posts, ({ one }) => {
  return {
    author: one(users, {
      fields: [posts.authorId],
      references: [users.id],
    }),
  };
});
