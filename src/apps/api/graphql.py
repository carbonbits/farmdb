"""
GraphQL schema assembly.
Single place that composes all feature mutations into one schema.
"""
from __future__ import annotations

import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi import Request

from features.farm.graphql import FarmMutation


@strawberry.type
class Mutation(FarmMutation):
    pass


@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"


schema = strawberry.Schema(query=Query, mutation=Mutation)


async def get_context(request: Request) -> dict:
    return {"request": request}


graphql_router = GraphQLRouter(
    schema,
    context_getter=get_context,
)