FGA_MODEL = """
model
  schema 1.1

type user

type organization
  relations
    define member: [user]
    define administrator: [user] or member
    define farms_administrator: [user] or administrator
    define create_farm: [user] or farms_administrator

type farm
  relations
    define owner: [user, organization]
    define administrator: [user] or owner
    define manager: [user] or administrator
    define member: [user] or manager
    define read: [user] or manager
    define update: [user] or administrator
"""