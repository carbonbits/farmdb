import { Notice } from "@farmdb/field-manager/manager/setup/_ui/notice";

/**
 * Step three: who works on the farm. The API has no endpoint to add members
 * yet, so the step says so instead of offering a form that cannot save.
 */
export function MembersStep() {
  return (
    <Notice title="Adding members is coming soon">
      You are the owner of this farm. Inviting others by email or phone, with a role each, arrives
      in a later update.
    </Notice>
  );
}
