/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export interface IObject {
    gid: number;
    id: number;
    name: string;
    width: number;
    height: number;
    x: number;
    y: number;
    properties: { [key: string]: any };
    rotation: number;
    type: string;
    visible: boolean;
}

export function cloneObject(obj: IObject): IObject {
    let cloned_obj: IObject = {
        gid: obj.gid,
        id: obj.id,
        name: obj.name,
        width: obj.width,
        height: obj.height,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        type: obj.type,
        visible: obj.visible,
        properties: {}
    };

    for (let key in obj.properties) {
        if (obj.properties.hasOwnProperty(key)) {
            cloned_obj.properties[key] = obj.properties[key];
        }
    }

    return cloned_obj;
}
