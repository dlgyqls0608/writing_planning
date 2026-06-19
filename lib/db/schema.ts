import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import type { StoryContext } from '@/types'

// ── Better Auth tables ────────────────────────────────────────────────────────

export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image:         text('image'),
  createdAt:     timestamp('created_at').notNull(),
  updatedAt:     timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id:          text('id').primaryKey(),
  expiresAt:   timestamp('expires_at').notNull(),
  token:       text('token').notNull().unique(),
  createdAt:   timestamp('created_at').notNull(),
  updatedAt:   timestamp('updated_at').notNull(),
  ipAddress:   text('ip_address'),
  userAgent:   text('user_agent'),
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id:                     text('id').primaryKey(),
  accountId:              text('account_id').notNull(),
  providerId:             text('provider_id').notNull(),
  userId:                 text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken:            text('access_token'),
  refreshToken:           text('refresh_token'),
  idToken:                text('id_token'),
  accessTokenExpiresAt:   timestamp('access_token_expires_at'),
  refreshTokenExpiresAt:  timestamp('refresh_token_expires_at'),
  scope:                  text('scope'),
  password:               text('password'),
  createdAt:              timestamp('created_at').notNull(),
  updatedAt:              timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at'),
  updatedAt:  timestamp('updated_at'),
})

// ── App tables ────────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:          text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title:            text('title').notNull(),
  genre:            text('genre').notNull(),
  target_episodes:  integer('target_episodes').notNull().default(100),
  logline:          text('logline'),
  story_context:    jsonb('story_context').$type<StoryContext>(),
  created_at:       timestamp('created_at').notNull().defaultNow(),
  updated_at:       timestamp('updated_at').notNull().defaultNow(),
})

export const documents = pgTable('documents', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  project_id:  uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type:        text('type').notNull(),
  title:       text('title').notNull(),
  content:     text('content').notNull().default(''),
  user_input:  text('user_input').notNull().default(''),
  status:      text('status').notNull().default('empty'),
  created_at:  timestamp('created_at').notNull().defaultNow(),
  updated_at:  timestamp('updated_at').notNull().defaultNow(),
})

export const document_versions = pgTable('document_versions', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  document_id:    uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  version_number: integer('version_number').notNull(),
  content:        text('content').notNull(),
  user_input:     text('user_input').notNull().default(''),
  saved_at:       timestamp('saved_at').notNull().defaultNow(),
})

export const characters = pgTable('characters', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  project_id:       uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:             text('name').notNull(),
  role:             text('role').notNull(),
  description:      text('description').notNull().default(''),
  memo:             text('memo').notNull().default(''),
  is_deceased:      boolean('is_deceased').notNull().default(false),
  deceased_episode: integer('deceased_episode'),
  created_at:       timestamp('created_at').notNull().defaultNow(),
})

export const foreshadows = pgTable('foreshadows', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  project_id:       uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content:          text('content').notNull(),
  is_resolved:      boolean('is_resolved').notNull().default(false),
  planted_episode:  integer('planted_episode'),
  resolved_episode: integer('resolved_episode'),
  created_at:       timestamp('created_at').notNull().defaultNow(),
})

// ── Relations ─────────────────────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ many }) => ({
  documents: many(documents),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.project_id],
    references: [projects.id],
  }),
}))
