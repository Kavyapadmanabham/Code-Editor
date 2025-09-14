"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import {
  Folder,
  File,
  PlusCircle,
  Trash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EXTENSION_LANGUAGE_MAP } from "../constants";

const NavPanel = ({ workspaceId, openFile }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderStates, setFolderStates] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [creatingType, setCreatingType] = useState(null);
  const [creatingParentFolderId, setCreatingParentFolderId] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [renamingItem, setRenamingItem] = useState(null);
  const router = useRouter();

  const truncateName = (name) => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  // Helper to get language from filename
  const getLanguageFromFilename = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] || "plaintext";
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const membersRef = collection(db, `workspaces/${workspaceId}/members`);
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map((doc) => doc.data());
      const member = membersData.find((m) => m.userId === user.uid);
      if (member) setUserRole(member.role);
    });

    const foldersRef = collection(db, `workspaces/${workspaceId}/folders`);
    const unsubscribeFolders = onSnapshot(foldersRef, (snapshot) => {
      const foldersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(foldersData);

      const initialFolderStates = {};
      foldersData.forEach((folder) => {
        initialFolderStates[folder.id] = false;
      });
      setFolderStates(initialFolderStates);
    });

    const filesRef = collection(db, `workspaces/${workspaceId}/files`);
    const unsubscribeFiles = onSnapshot(filesRef, (snapshot) => {
      setFiles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeMembers();
      unsubscribeFolders();
      unsubscribeFiles();
    };
  }, [workspaceId]);

  const toggleFolder = (folderId) => {
    setFolderStates((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleDragStart = (e, item, type) => {
    e.stopPropagation();
    setDraggedItem({ id: item.id, type });
  };

  const handleDragOver = (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === targetFolderId) return;

    try {
      const isFolder = draggedItem.type === "folder";
      const collectionName = isFolder ? "folders" : "files";
      const fieldName = isFolder ? "parentFolderId" : "folderId";

      await updateDoc(
        doc(db, `workspaces/${workspaceId}/${collectionName}/${draggedItem.id}`),
        { [fieldName]: targetFolderId || null }
      );
    } catch (error) {
      console.error("Error moving item:", error);
    }
    setDraggedItem(null);
  };

  const createItem = async (folderid) => {
    if (!newItemName) return;

    try {
      if (creatingType === "folder") {
        await addDoc(collection(db, `workspaces/${workspaceId}/folders`), {
          name: newItemName,
          parentFolderId: creatingParentFolderId,
        });
      } else {
        // Detect language from extension
        const detectedLanguage = getLanguageFromFilename(newItemName);
        await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
          name: newItemName,
          folderId: creatingParentFolderId,
          workspaceId,
          language: detectedLanguage,
          content: "", // New file, empty content
        });
      }
      setNewItemName("");
      setCreatingType(null);
      setCreatingParentFolderId(null);
      setFolderStates({ ...folderStates, [folderid]: true });

    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const renameItem = async () => {
    if (!renamingItem?.name) return;

    try {
      const collectionName = renamingItem.type === "folder" ? "folders" : "files";
      const docRef = doc(db, `workspaces/${workspaceId}/${collectionName}/${renamingItem.id}`);
      const updateData = { name: renamingItem.name };
      if (renamingItem.type === "file") {
        // Detect new language if extension changed
        const detectedLanguage = getLanguageFromFilename(renamingItem.name);
        updateData.language = detectedLanguage;
      }
      await updateDoc(docRef, updateData);
      setRenamingItem(null);
    } catch (error) {
      console.error("Error renaming item:", error);
    }
  };

  const deleteItem = async (type, id) => {
    if (type === "folders") {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${id}`));
      const nestedFolders = folders.filter(
        (folder) => folder.parentFolderId === id
      );
      for (const nestedFolder of nestedFolders) {
        await deleteItem("folders", nestedFolder.id);
      }
      const folderFiles = files.filter((file) => file.folderId === id);
      for (const file of folderFiles) {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${file.id}`));
      }
    } else {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${id}`));
    }
  };

  const handleFileOpen = (file) => {
    // Always detect language from filename if not present
    let detectedLanguage = file.language;
    if (!detectedLanguage) {
      if (file.name && file.name.includes('.')) {
        detectedLanguage = getLanguageFromFilename(file.name);
      } else {
        detectedLanguage = 'plaintext';
      }
    }
    openFile({ ...file, language: detectedLanguage });
  };

  const renderFolder = (folder) => {
    const nestedFolders = folders.filter((f) => f.parentFolderId === folder.id);
    const folderFiles = files.filter((file) => file.folderId === folder.id);

    return (
      <div
        key={folder.id}
        className=" ml-3 border-l border-gray-700"
        draggable
        onDragStart={(e) => handleDragStart(e, folder, "folder")}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        <div className="flex items-center justify-between group hover:bg-gray-800 px-1 py-2 rounded transition-colors">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
          >
            {folderStates[folder.id] ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            <Folder size={16} className="mr-2 text-blue-400" />
            {renamingItem?.id === folder.id ? (
              <input
                className="text-sm bg-gray-800 text-white px-2 py-1 rounded"
                value={renamingItem.name}
                onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                onBlur={renameItem}
                onKeyPress={(e) => e.key === "Enter" && renameItem()}
                autoFocus
              />
            ) : (
              <span
                className="text-sm"
                onDoubleClick={() => setRenamingItem({ id: folder.id, name: folder.name, type: "folder" })}
              >
                {truncateName(folder.name)}
              </span>
            )}
          </div>

          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <Folder
                size={14}
                className="text-blue-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) => (prev === "folder" ? null : "folder"));
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
              />
              <File
                size={14}
                className="text-orange-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingType((prev) => (prev === "file" ? null : "file"));
                  setCreatingParentFolderId(folder.id);
                  setNewItemName("");
                  setFolderStates({ ...folderStates, [folder.id]: true });
                }}
              />
              <Trash
                size={14}
                className="text-gray-400 hover:text-red-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem("folders", folder.id);
                }}
              />
            </div>
          )}
        </div>

        {folderStates[folder.id] && (
          <div className="ml-1">
            {creatingType && creatingParentFolderId === folder.id && (
              <div className="ml-4 flex items-center px-2 py-1">
                <input
                  className="text-sm bg-gray-800 text-white px-2  py-1 rounded flex-1"
                  placeholder={`New ${creatingType} name`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={createItem}
                  onKeyPress={(e) => e.key === "Enter" && createItem(folder.id)}
                  autoFocus
                />
              </div>
            )}
            {nestedFolders.map((nestedFolder) => renderFolder(nestedFolder))}
            {folderFiles.map((file) => (
              <div
                key={file.id}
                className="ml-6 flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, file, "file")}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div
                  className="flex items-center cursor-pointer flex-1"
                  onClick={() => handleFileOpen(file)}
                >
                  <File size={16} className="mr-2 text-orange-400" />
                  {renamingItem?.id === file.id ? (
                    <input
                      className="text-sm bg-gray-700 text-white px-1 rounded"
                      value={renamingItem.name}
                      onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                      onBlur={renameItem}
                      onKeyPress={(e) => e.key === "Enter" && renameItem()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm"
                      onDoubleClick={() => setRenamingItem({ id: file.id, name: file.name, type: "file" })}
                    >
                      {truncateName(file.name)}
                    </span>
                  )}
                </div>
                {(userRole === "contributor" || userRole === "owner") && (
                  <Trash
                    size={14}
                    className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem("files", file.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-300 h-full w-full flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold mb-8 text-right">FILE EXPLORER</h2>
        <div className="flex space-x-2 justify-start ">
          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCreatingParentFolderId(null);
                  setNewItemName("");
                  setCreatingType((prev) => (prev === "folder" ? null : "folder"));
                }}
                className="hover:bg-blue-700 bg-blue-500 bg-opacity-10 ring-1 ring-blue-500  px-2 py-1 rounded-md text-xs flex gap-1"
              > Add folder
                <Folder size={16} className="text-gray-400 " />
              </button>
              <button
                onClick={() => {
                  setCreatingParentFolderId(null);
                  setNewItemName("");
                  setCreatingType((prev) => (prev === "file" ? null : "file"));
                }}
                className=" hover:bg-orange-700 bg-orange-500 bg-opacity-10 ring-1 ring-orange-400  px-2 py-1 rounded-md flex items-center text-xs gap-1"
              >  Add file
                <File size={16} className="text-orange-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto py-2 px-1"
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={(e) => handleDrop(e, null)}
      >
        {creatingType && !creatingParentFolderId && (
          <div className="flex items-center px-2 py-1">
            <input
              className="text-sm bg-gray-800 py-1 text-white px-3 rounded flex-1"
              placeholder={`New ${creatingType} name`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={createItem}
              onKeyPress={(e) => e.key === "Enter" && createItem()}
              autoFocus
            />
          </div>
        )}

        {folders
          .filter((folder) => !folder.parentFolderId)
          .map((folder) => renderFolder(folder))}

        {files
          .filter((file) => !file.folderId)
          .map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, file, "file")}
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              <div
                className="flex items-center cursor-pointer flex-1 border-l border-gray-700 ml-1 px-2 py-1"
                onClick={() => handleFileOpen(file)}
              >
                <File size={16} className="mr-2 text-orange-400" />
                {renamingItem?.id === file.id ? (
                  <input
                    className="text-sm bg-gray-700 text-white px-1 rounded"
                    value={renamingItem.name}
                    onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                    onBlur={renameItem}
                    onKeyPress={(e) => e.key === "Enter" && renameItem()}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm"
                    onDoubleClick={() => setRenamingItem({ id: file.id, name: file.name, type: "file" })}
                  >
                    {truncateName(file.name)}
                  </span>
                )}
              </div>
              {(userRole === "contributor" || userRole === "owner") && (
                <Trash
                  size={14}
                  className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem("files", file.id);
                  }}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default NavPanel;