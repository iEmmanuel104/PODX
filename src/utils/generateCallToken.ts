import { AccessToken, Role } from "@huddle01/server-sdk/auth";

// Define types for permissions and metadata
export interface CanProduceSources {
    cam: boolean;
    mic: boolean;
    screen: boolean;
}

export interface TokenPermissions {
    admin: boolean;
    canConsume: boolean;
    canProduce: boolean;
    canProduceSources: CanProduceSources;
    canRecvData: boolean;
    canSendData: boolean;
    canUpdateMetadata: boolean;
}

export interface TokenMetadata {
    [key: string]: any;
}

// Valid roles as per Huddle01 documentation
export type ValidRole =
    | "host"
    | "coHost"
    | "guest"
    | "speaker"
    | "listener"
    | "bot";

export interface GenerateTokenOptions {
    apiKey: string;
    roomId: string;
    role: ValidRole;
    permissions: TokenPermissions;
    metadata?: TokenMetadata;
}

/**
 * Generates a call token for Huddle01
 *
 * @param options - Options for generating the token
 * @returns JWT token string
 */
export const generateCallToken = async (
    options: GenerateTokenOptions,
): Promise<string> => {
    const { apiKey, roomId, role, permissions, metadata } = options;

    // Validate role
    const validRoles: ValidRole[] = [
        "host",
        "coHost",
        "guest",
        "speaker",
        "listener",
        "bot",
    ];
    if (!role || !validRoles.includes(role)) {
        throw new Error(
            `Invalid role: ${role}. Valid roles are: ${validRoles.join(", ")}`,
        );
    }

    // Validate permissions
    if (!permissions) {
        throw new Error("Permissions are required");
    }

    // Validate required permission fields
    const requiredPermissionFields: (keyof TokenPermissions)[] = [
        "admin",
        "canConsume",
        "canProduce",
        "canProduceSources",
        "canRecvData",
        "canSendData",
        "canUpdateMetadata",
    ];

    for (const field of requiredPermissionFields) {
        if (field === "canProduceSources") {
            if (!permissions.canProduceSources) {
                throw new Error("canProduceSources is required in permissions");
            }
            // Check canProduceSources fields
            const { cam, mic, screen } = permissions.canProduceSources;
            if (
                cam === undefined ||
                mic === undefined ||
                screen === undefined
            ) {
                throw new Error(
                    "All canProduceSources fields (cam, mic, screen) are required",
                );
            }
        } else if (permissions[field] === undefined) {
            throw new Error(`${field} is required in permissions`);
        }
    }
    // Map our role string to the Role enum from the SDK
    const roleMapping: Record<ValidRole, keyof typeof Role> = {
        host: "HOST",
        coHost: "CO_HOST",
        guest: "GUEST",
        speaker: "SPEAKER",
        listener: "LISTENER",
        bot: "BOT",
    };

    // Create access token
    const accessToken = new AccessToken({
        apiKey,
        roomId,
        role: Role[roleMapping[role]],
        permissions,
        options: {
            metadata,
        },
    });

    // Generate JWT
    return accessToken.toJwt();
};

export default generateCallToken;
